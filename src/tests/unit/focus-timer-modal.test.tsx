import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FocusTimerModal } from "@/components/focus/focus-timer-modal";
import { useApp } from "@/lib/store/app-context";
import { TaskItem, LifeDomainItem } from "@/types";

jest.mock("canvas-confetti", () => jest.fn());

jest.mock("@/lib/store/app-context", () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

describe("FocusTimerModal", () => {
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
    id: "task-interview-prep",
    domainId: "dom-career",
    title: "Interview Preparation",
    columnId: "TODO",
    isCompleted: false,
    xpReward: 60,
    sortOrder: 1,
    planningEngineType: "MULTI_TASK",
  };

  let mockCloseFocusModal: jest.Mock;
  let mockRecordCompletedFocus: jest.Mock;
  let mockSetFocusTargetTask: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockCloseFocusModal = jest.fn();
    mockRecordCompletedFocus = jest.fn();
    mockSetFocusTargetTask = jest.fn();

    mockUseApp.mockReturnValue({
      isFocusModalOpen: true,
      closeFocusModal: mockCloseFocusModal,
      focusTargetTask: sampleTask,
      tasks: [sampleTask],
      domains: [sampleDomain],
      recordCompletedFocus: mockRecordCompletedFocus,
      setFocusTargetTask: mockSetFocusTargetTask,
    } as any);
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it("renders with task title and default 25m duration", () => {
    render(<FocusTimerModal />);
    expect(screen.getByText("Interview Preparation")).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("switches to 15m, 45m, or 60m preset when selected", () => {
    render(<FocusTimerModal />);

    // Select 15m preset
    const btn15 = screen.getByRole("button", { name: "15m" });
    fireEvent.click(btn15);
    expect(screen.getByText("15:00")).toBeInTheDocument();

    // Select 60m preset
    const btn60 = screen.getByRole("button", { name: "60m" });
    fireEvent.click(btn60);
    expect(screen.getByText("60:00")).toBeInTheDocument();
  });

  it("does NOT reset selected preset duration when tasks array updates (e.g. background polling)", () => {
    const { rerender } = render(<FocusTimerModal />);

    // Select 15m preset
    const btn15 = screen.getByRole("button", { name: "15m" });
    fireEvent.click(btn15);
    expect(screen.getByText("15:00")).toBeInTheDocument();

    // Simulate background polling (tasks array reference changes every 3s)
    mockUseApp.mockReturnValue({
      isFocusModalOpen: true,
      closeFocusModal: mockCloseFocusModal,
      focusTargetTask: sampleTask,
      tasks: [{ ...sampleTask, updatedAt: new Date().toISOString() }], // new reference
      domains: [sampleDomain],
      recordCompletedFocus: mockRecordCompletedFocus,
      setFocusTargetTask: mockSetFocusTargetTask,
    } as any);

    rerender(<FocusTimerModal />);

    // Must still remain at 15:00, NOT reset back to 25:00!
    expect(screen.getByText("15:00")).toBeInTheDocument();
  });

  it("starts the timer and continues running despite background tasks polling", () => {
    const { rerender } = render(<FocusTimerModal />);

    // Start 25m timer
    const startButton = screen.getByRole("button", { name: /start focus/i });
    fireEvent.click(startButton);

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("24:59")).toBeInTheDocument();

    // Advance another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("24:58")).toBeInTheDocument();

    // Simulate background polling tick at 2-3 seconds
    mockUseApp.mockReturnValue({
      isFocusModalOpen: true,
      closeFocusModal: mockCloseFocusModal,
      focusTargetTask: sampleTask,
      tasks: [{ ...sampleTask, updatedAt: new Date().toISOString() }],
      domains: [sampleDomain],
      recordCompletedFocus: mockRecordCompletedFocus,
      setFocusTargetTask: mockSetFocusTargetTask,
    } as any);

    rerender(<FocusTimerModal />);

    // Advance another second: timer must STILL be running (Pause button visible, not reset to Start Focus)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("24:57")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("completes session and records focus on Instant Finish", () => {
    render(<FocusTimerModal />);

    const finishBtn = screen.getByRole("button", { name: /test instant finish/i });
    fireEvent.click(finishBtn);

    expect(screen.getByText(/Focus Completed!/i)).toBeInTheDocument();
    expect(mockRecordCompletedFocus).toHaveBeenCalledWith(
      1500, // 25 min default in seconds
      expect.any(Number),
      sampleTask
    );
  });
});
