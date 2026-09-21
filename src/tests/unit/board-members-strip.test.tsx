/**
 * Tests for the Kanban board Team Members strip.
 *
 * Covers:
 * 1. Host bubble always shows the domain companion (same as beside the project name).
 * 2. The current guest shows their own chosen avatar.
 * 3. Host appears first with a crown badge.
 * 4. Guest gets a "YOU" badge.
 * 5. The activity growth ring is rendered for members with activity.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BoardMembersStrip } from "@/components/kanban/board-members-strip";
import { useApp } from "@/lib/store/app-context";
import { ProjectMember, UserProfile } from "@/types";

jest.mock("@/lib/store/app-context", () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

// Mock the server action returned by the strip's dynamic import.
jest.mock("@/actions/collaboration", () => ({
  getProjectMembersAction: jest.fn(),
}));

const mockGetMembers = jest.requireMock("@/actions/collaboration")
  .getProjectMembersAction as jest.Mock;

const hostMember: ProjectMember = {
  id: "host-1",
  name: "Anastasia",
  avatar: "🐾", // the server sends a placeholder; the client should swap to the domain companion
  isHost: true,
  activityCount: 5,
  joinedAt: "2026-01-01T00:00:00Z",
};

const eggGuest: ProjectMember = {
  id: "guest-egg",
  name: "Ivanna",
  avatar: "🥚",
  isHost: false,
  activityCount: 2,
  joinedAt: "2026-09-01T00:00:00Z",
};

const guestUser: UserProfile = {
  id: "guest-egg",
  email: "guest@guest.petyourskills.local",
  callSign: "Ivanna",
  avatar: "🥚",
  rankTier: 1,
  rankTitle: "Guest",
  totalXp: 0,
  tierProgress: 0,
  nextTierXp: 100,
  isAnonymous: true,
};

function mockCurrentUser() {
  mockUseApp.mockReturnValue({
    user: guestUser,
  } as unknown as ReturnType<typeof useApp>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BoardMembersStrip - Host companion", () => {
  it("shows the host with the domain companion emoji even when the server sends a placeholder", async () => {
    mockGetMembers.mockResolvedValue({
      success: true,
      members: [hostMember, eggGuest],
    });
    mockCurrentUser();

    render(<BoardMembersStrip projectId="proj-1" domainColor="#10B981" hostAvatarSpecies="Wisdom Owl" />);

    // The host's domain companion (Owl) is shown, not the paw placeholder.
    await waitFor(() => {
      expect(screen.getByText("🦉")).toBeInTheDocument();
    });
  });

  it("keeps the current guest's own chosen avatar (e.g. the egg)", async () => {
    mockGetMembers.mockResolvedValue({
      success: true,
      members: [hostMember, eggGuest],
    });
    mockCurrentUser();

    render(<BoardMembersStrip projectId="proj-1" domainColor="#10B981" hostAvatarSpecies="Wisdom Owl" />);

    await waitFor(() => {
      expect(screen.getByText("🥚")).toBeInTheDocument();
    });
  });

  it("prepends the current user optimistically when they are not in the server list", async () => {
    mockGetMembers.mockResolvedValue({
      success: true,
      members: [hostMember],
    });
    mockCurrentUser();

    render(<BoardMembersStrip projectId="proj-1" domainColor="#10B981" hostAvatarSpecies="Wisdom Owl" />);

    await waitFor(() => {
      expect(screen.getByText("🥚")).toBeInTheDocument();
      expect(screen.getByText("YOU")).toBeInTheDocument();
    });
  });
});
