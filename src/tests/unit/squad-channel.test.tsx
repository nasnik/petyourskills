/**
 * Tests for the SquadChannel (docked chat panel).
 *
 * Covers:
 * 1. Renders the header with presence ("X Online").
 * 2. Displays chat messages with sender identity.
 * 3. Displays SYSTEM_QUEST_LOG system cards.
 * 4. Sends a message via sendBoardMessageAction.
 * 5. Shows the Shared Focus buff when 2+ members are focusing.
 * 6. Collapses and expands the panel.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SquadChannel } from "@/components/kanban/squad-channel";
import { useApp } from "@/lib/store/app-context";
import { BoardMessageItem, SquadPresence, UserProfile } from "@/types";

jest.mock("@/lib/store/app-context", () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

// The chat actions are dynamically imported by the component.
jest.mock("@/actions/chat", () => ({
  getBoardMessagesAction: jest.fn(),
  syncPresenceAction: jest.fn(),
  sendBoardMessageAction: jest.fn(),
}));

const mockGetMessages = jest.requireMock("@/actions/chat")
  .getBoardMessagesAction as jest.Mock;
const mockSyncPresence = jest.requireMock("@/actions/chat")
  .syncPresenceAction as jest.Mock;
const mockSend = jest.requireMock("@/actions/chat")
  .sendBoardMessageAction as jest.Mock;

const currentUser: UserProfile = {
  id: "guest-wolf",
  email: "guest@guest.petyourskills.local",
  callSign: "homyak",
  avatar: "🐺",
  rankTier: 1,
  rankTitle: "Guest",
  totalXp: 0,
  tierProgress: 0,
  nextTierXp: 100,
  isAnonymous: true,
};

function mockApp(overrides: Partial<Record<string, unknown>> = {}) {
  mockUseApp.mockReturnValue({
    user: currentUser,
    isFocusModalOpen: false,
    ...overrides,
  } as never);
}

function sampleMessage(overrides: Partial<BoardMessageItem> = {}): BoardMessageItem {
  return {
    id: "msg-1",
    boardId: "board-1",
    userId: "guest-wolf",
    userName: "homyak",
    userAvatar: "🐺",
    content: "Hello squad!",
    type: "TEXT",
    companionBadge: "Vitality Wolf Lv.12",
    xpRewardYield: null,
    createdAt: "2026-09-20T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SquadChannel", () => {
  it("renders the header and shows the online count", async () => {
    mockApp();
    mockGetMessages.mockResolvedValue({ success: true, messages: [] });
    mockSyncPresence.mockResolvedValue({
      success: true,
      presence: [
        {
          userId: "guest-wolf",
          name: "homyak",
          avatar: "🐺",
          isFocusing: false,
          onlineAt: new Date().toISOString(),
        } as SquadPresence,
      ],
    });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    expect(await screen.findByText("Squad Channel")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("1 Online")).toBeInTheDocument();
    });
  });

  it("displays a TEXT chat message with sender identity and companion badge", async () => {
    mockApp();
    mockGetMessages.mockResolvedValue({
      success: true,
      messages: [sampleMessage()],
    });
    mockSyncPresence.mockResolvedValue({ success: true, presence: [] });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    expect(await screen.findByText("Hello squad!")).toBeInTheDocument();
    expect(screen.getByText("homyak")).toBeInTheDocument();
    expect(screen.getByText("Vitality Wolf Lv.12")).toBeInTheDocument();
  });

  it("displays SYSTEM_QUEST_LOG system cards", async () => {
    mockApp();
    mockGetMessages.mockResolvedValue({
      success: true,
      messages: [
        sampleMessage({
          id: "quest-1",
          content: "Morning 5km Run",
          type: "SYSTEM_QUEST_LOG",
          xpRewardYield: 150,
          companionBadge: null,
        }),
      ],
    });
    mockSyncPresence.mockResolvedValue({ success: true, presence: [] });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    expect(await screen.findByText(/finished/)).toBeInTheDocument();
    expect(screen.getByText(/Morning 5km Run/)).toBeInTheDocument();
    expect(screen.getByText("(+150 XP)")).toBeInTheDocument();
  });

  it("sends a message through sendBoardMessageAction", async () => {
    mockApp();
    mockGetMessages.mockResolvedValue({ success: true, messages: [] });
    mockSyncPresence.mockResolvedValue({ success: true, presence: [] });
    mockSend.mockResolvedValue({ success: true, message: sampleMessage({ content: "On it!" }) });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    const input = screen.getByPlaceholderText(/message squad/i);
    fireEvent.change(input, { target: { value: "On it!" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith("board-1", "On it!");
    });
  });

  it("shows the Shared Focus XP buff when 2+ members are focusing", async () => {
    mockApp({ isFocusModalOpen: false });
    mockGetMessages.mockResolvedValue({ success: true, messages: [] });
    mockSyncPresence.mockResolvedValue({
      success: true,
      presence: [
        { userId: "a", name: "Ana", avatar: "🦉", isFocusing: true, onlineAt: new Date().toISOString() },
        { userId: "b", name: "Alex", avatar: "🐉", isFocusing: true, onlineAt: new Date().toISOString() },
      ] as SquadPresence[],
    });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    await waitFor(() => {
      expect(screen.getByText("+20% XP")).toBeInTheDocument();
    });
  });

  it("collapses and expands the panel", async () => {
    mockApp();
    mockGetMessages.mockResolvedValue({ success: true, messages: [] });
    mockSyncPresence.mockResolvedValue({ success: true, presence: [] });

    render(<SquadChannel projectId="board-1" domainColor="#10B981" />);

    const collapseBtn = screen.getByTitle("Collapse");
    fireEvent.click(collapseBtn);

    // Header hidden when collapsed — only the expand icon remains.
    expect(screen.queryByText("Squad Channel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Expand Squad Channel"));
    expect(await screen.findByText("Squad Channel")).toBeInTheDocument();
  });
});
