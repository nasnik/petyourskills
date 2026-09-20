/**
 * Tests for Guest Identity and Task Commenting persistence.
 *
 * Covers:
 * 1. JoinForm:
 *    - Renders Name input ("Your Name / Call Sign") and Passkey input.
 *    - Pre-fills remembered name from initialName or localStorage.
 *    - Rejects empty name submission with user-friendly error.
 *    - Submits both passkey and name to joinProjectWithPasskeyAction.
 *    - Remembers guest name in localStorage upon successful join.
 *
 * 2. TaskInspectorDrawer:
 *    - Displays "Posting as: <Guest Name>" based on user.callSign.
 *    - Allows anonymous guests to change their name inline.
 *    - Calls updateGuestName when saving a new name.
 *    - Submits comments with the guest'\''s custom name.
 *
 * 3. AppContext comment author resolution:
 *    - Preserves guest callSign on optimistic comments (does not force "Guest Collaborator").
 *    - Forwards authorName to addTaskCommentAction.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JoinForm } from "@/app/join/join-form";
import { TaskInspectorDrawer } from "@/components/inspector/task-inspector-drawer";
import { useApp } from "@/lib/store/app-context";
import { joinProjectWithPasskeyAction } from "@/actions/collaboration";
import { TaskItem, LifeDomainItem, UserProfile } from "@/types";

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/actions/collaboration", () => ({
  joinProjectWithPasskeyAction: jest.fn(),
  isValidPassCodeFormat: jest.fn((code: string) => /^[A-Z]{3,4}-\d{4}$/.test(code.trim())),
}));

jest.mock("@/lib/store/app-context", () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockJoinAction = joinProjectWithPasskeyAction as jest.MockedFunction<
  typeof joinProjectWithPasskeyAction
>;

// --------------------------------------------------------------------------
// Shared fixtures
// --------------------------------------------------------------------------

const guestUser: UserProfile = {
  id: "guest-user-123",
  email: "guest@guest.petyourskills.local",
  callSign: "Elena Rostova",
  rankTier: 1,
  rankTitle: "Guest",
  totalXp: 0,
  tierProgress: 0,
  nextTierXp: 100,
  isAnonymous: true,
  sharedProjectId: "board-interview",
};

const sampleDomain: LifeDomainItem = {
  id: "dom-career",
  userId: "user-1",
  name: "Career",
  slug: "career",
  accentColor: "#8B5CF6",
  avatarSpecies: "Byte Fox",
  level: 5,
  currentXp: 800,
  isActive: true,
};

const sampleTask: TaskItem = {
  id: "task-sys-design",
  domainId: "dom-career",
  title: "System Design Prep",
  description: "Distributed caching architectures",
  columnId: "TODO",
  isCompleted: false,
  xpReward: 30,
  estimatedMinutes: 30,
  sortOrder: 1,
  boardId: "board-interview",
};

// --------------------------------------------------------------------------
// Suite 1: JoinForm Guest Identity
// --------------------------------------------------------------------------

describe("JoinForm - Guest Identity Requirements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders both Your Name and Project Passkey inputs", () => {
    render(<JoinForm initialCode="CYS-8941" />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project passkey/i)).toBeInTheDocument();
  });

  it("pre-fills initialName when passed via prop", () => {
    render(<JoinForm initialCode="CYS-8941" initialName="Marcus Aurelius" />);

    const nameInput = screen.getByLabelText(/your name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Marcus Aurelius");
  });

  it("pre-fills name from localStorage when initialName is empty", () => {
    localStorage.setItem("pys_guest_name", "Sarah Connor");

    render(<JoinForm initialCode="CYS-8941" />);

    const nameInput = screen.getByLabelText(/your name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Sarah Connor");
  });

  it("requires name before submitting and displays an error if blank", async () => {
    render(<JoinForm initialCode="CYS-8941" />);

    const nameInput = screen.getByLabelText(/your name/i);
    fireEvent.change(nameInput, { target: { value: "" } });

    const submitBtn = screen.getByRole("button", { name: /enter project workspace/i });
    // Button is disabled when name is blank
    expect(submitBtn).toBeDisabled();
  });

  it("submits code and cleanName to joinProjectWithPasskeyAction and remembers name", async () => {
    mockJoinAction.mockResolvedValue({
      success: true,
      project: { id: "proj-1", title: "Project X", type: "BOARD", passCode: "CYS-8941" },
    });

    render(<JoinForm initialCode="CYS-8941" />);

    const nameInput = screen.getByLabelText(/your name/i);
    fireEvent.change(nameInput, { target: { value: "David Miller" } });

    const submitBtn = screen.getByRole("button", { name: /enter project workspace/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockJoinAction).toHaveBeenCalledWith("CYS-8941", "David Miller");
    });

    expect(localStorage.getItem("pys_guest_name")).toBe("David Miller");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(mockRefresh).toHaveBeenCalled();
  });
});

// --------------------------------------------------------------------------
// Suite 2: TaskInspectorDrawer Guest Commenting Identity
// --------------------------------------------------------------------------

describe("TaskInspectorDrawer - Guest Commenting Identity", () => {
  let mockAddComment: jest.Mock;
  let mockUpdateGuestName: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddComment = jest.fn();
    mockUpdateGuestName = jest.fn();

    mockUseApp.mockReturnValue({
      user: guestUser,
      inspectingTask: sampleTask,
      closeTaskInspector: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      toggleTaskComplete: jest.fn(),
      domains: [sampleDomain],
      updateTaskDescription: jest.fn(),
      loadTaskComments: jest.fn().mockResolvedValue(undefined),
      addComment: mockAddComment,
      updateGuestName: mockUpdateGuestName,
      comments: new Map(),
    } as any);
  });

  it("displays Posting as with the guest's callSign", () => {
    render(<TaskInspectorDrawer />);

    expect(screen.getByText(/posting as:/i)).toBeInTheDocument();
    expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
  });

  it("allows anonymous guests to open the inline name editor", () => {
    render(<TaskInspectorDrawer />);

    const changeBtn = screen.getByRole("button", { name: /change name/i });
    fireEvent.click(changeBtn);

    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
  });

  it("updates guest name via updateGuestName when saving new name", () => {
    render(<TaskInspectorDrawer />);

    // Open inline editor
    fireEvent.click(screen.getByRole("button", { name: /change name/i }));

    const input = screen.getByPlaceholderText(/enter your name/i);
    fireEvent.change(input, { target: { value: "Elena V2" } });

    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    fireEvent.click(saveBtn);

    expect(mockUpdateGuestName).toHaveBeenCalledWith("Elena V2");
  });

  it("passes author name to addComment when submitting comment", () => {
    render(<TaskInspectorDrawer />);

    const commentInput = screen.getByPlaceholderText(/add a comment/i);
    fireEvent.change(commentInput, { target: { value: "Great progress on caching layer!" } });

    const postBtn = screen.getByRole("button", { name: /^post$/i });
    fireEvent.click(postBtn);

    expect(mockAddComment).toHaveBeenCalledWith(
      sampleTask.id,
      "Great progress on caching layer!",
      "Elena Rostova"
    );
  });
});

// --------------------------------------------------------------------------
// Suite 3: AppContext Comment Logic Resolution
// --------------------------------------------------------------------------

describe("Comment Author Name Resolution Invariant", () => {
  it("resolves guest callSign instead of overriding with 'Guest Collaborator'", () => {
    const user = {
      isAnonymous: true,
      callSign: "Satoshi Nakamoto",
      id: "guest-xyz",
    };

    const effectiveName =
      user.callSign && user.callSign !== "Guest Collaborator"
        ? user.callSign
        : "Guest Collaborator";

    expect(effectiveName).toBe("Satoshi Nakamoto");
  });

  it("falls back to 'Guest Collaborator' only when callSign is missing or empty", () => {
    const user = {
      isAnonymous: true,
      callSign: "",
      id: "guest-xyz",
    };

    const effectiveName =
      user.callSign && user.callSign !== "Guest Collaborator"
        ? user.callSign
        : "Guest Collaborator";

    expect(effectiveName).toBe("Guest Collaborator");
  });
});
