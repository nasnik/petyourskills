/**
 * Tests for the JoinForm companion avatar picker.
 *
 * Covers:
 * 1. The picker only appears once a valid name + passkey are entered.
 * 2. All 7 companion species render with their real emoji (not "??").
 * 3. Avatar selection is required — submit stays disabled until one is chosen.
 * 4. The chosen avatar is passed to joinProjectWithPasskeyAction.
 * 5. The chosen avatar is persisted to localStorage.
 * 6. A previously-saved avatar is pre-selected on mount.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JoinForm } from "@/app/join/join-form";
import { joinProjectWithPasskeyAction } from "@/actions/collaboration";

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

const mockJoinAction = joinProjectWithPasskeyAction as jest.MockedFunction<
  typeof joinProjectWithPasskeyAction
>;

// All 7 species shown in the picker, with their canonical emoji.
const EXPECTED_AVATARS = [
  { name: "Vitality Wolf", emoji: "🐺" },
  { name: "Byte Fox", emoji: "🦊" },
  { name: "Wisdom Owl", emoji: "🦉" },
  { name: "Hydro Dragon", emoji: "🐉" },
  { name: "Aegis Turtle", emoji: "🐢" },
  { name: "Zenith Panther", emoji: "🐆" },
  { name: "Mystery Egg", emoji: "🥚" },
];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("JoinForm - Avatar Picker", () => {
  it("does not show the picker until name and a valid passkey are entered", () => {
    render(<JoinForm initialCode="" />);

    expect(screen.queryByText("Choose Your Companion")).not.toBeInTheDocument();

    // Only name filled → still hidden
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Alex" } });
    expect(screen.queryByText("Choose Your Companion")).not.toBeInTheDocument();

    // Valid passkey added → picker slides in
    fireEvent.change(screen.getByLabelText(/project passkey/i), { target: { value: "CYS-8941" } });
    expect(screen.getByText("Choose Your Companion")).toBeInTheDocument();
  });

  it("renders all 7 species with real emojis (no '??' placeholders)", () => {
    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    expect(screen.getByText("Choose Your Companion")).toBeInTheDocument();

    for (const av of EXPECTED_AVATARS) {
      expect(screen.getByText(av.emoji)).toBeInTheDocument();
    }

    // The grid must not show any mangled "??" placeholders.
    expect(screen.queryByText("??")).not.toBeInTheDocument();
  });

  it("keeps the submit button disabled until an avatar is selected", () => {
    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    const submit = screen.getByRole("button", { name: /enter project workspace/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByText("🥚"));
    expect(submit).toBeEnabled();
  });

  it("passes the chosen avatar to joinProjectWithPasskeyAction", async () => {
    mockJoinAction.mockResolvedValue({
      success: true,
      project: { id: "proj-1", title: "Project X", type: "BOARD", passCode: "CYS-8941" },
    });

    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    fireEvent.click(screen.getByText("🦊"));

    const submit = screen.getByRole("button", { name: /enter project workspace/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockJoinAction).toHaveBeenCalledWith("CYS-8941", "Alex", "🦊");
    });
  });

  it("persists the selected avatar to localStorage on successful join", async () => {
    mockJoinAction.mockResolvedValue({
      success: true,
      project: { id: "proj-1", title: "Project X", type: "BOARD", passCode: "CYS-8941" },
    });

    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    fireEvent.click(screen.getByText("🥚"));
    fireEvent.click(screen.getByRole("button", { name: /enter project workspace/i }));

    await waitFor(() => {
      expect(localStorage.getItem("pys_guest_avatar")).toBe("🥚");
    });
  });

  it("pre-selects a previously saved avatar from localStorage on mount", () => {
    localStorage.setItem("pys_guest_avatar", "🐉");

    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    // Selection is reflected by the enabled submit button (a selection exists).
    const submit = screen.getByRole("button", { name: /enter project workspace/i });
    expect(submit).toBeEnabled();
  });

  it("shows a descriptive line with the selected companion name", () => {
    render(<JoinForm initialCode="CYS-8941" initialName="Alex" />);

    fireEvent.click(screen.getByText("🦉"));
    expect(screen.getByText("Wisdom Owl")).toBeInTheDocument();
    expect(screen.getByText(/calm & insightful/i)).toBeInTheDocument();
  });

  it("requires an avatar — errors if the user submits with none chosen", async () => {
    render(<JoinForm initialCode="CYS-8941" />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Alex" } });

    const submit = screen.getByRole("button", { name: /enter project workspace/i });
    // Disabled because no avatar selected, so clicking is a no-op.
    expect(submit).toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockJoinAction).not.toHaveBeenCalled();
    });
  });
});
