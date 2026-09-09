"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LifeDomainItem, TaskItem, UserProfile } from "@/types";
import { INITIAL_DOMAINS, INITIAL_TASKS, INITIAL_USER_PROFILE } from "@/lib/mock-data";
import { calculateUserRank } from "@/lib/gamification/xp-engine";

interface AppContextType {
  user: UserProfile;
  domains: LifeDomainItem[];
  tasks: TaskItem[];
  selectedDomainSlug: string | null;
  setSelectedDomainSlug: (slug: string | null) => void;
  toggleTaskComplete: (taskId: string) => void;
  addTask: (domainId: string, title: string, estimatedMinutes?: number, xpReward?: number) => void;
  updateTask: (task: Partial<TaskItem> & { id: string }) => void;
  deleteTask: (taskId: string) => void;
  
  // Focus Timer Overlay State
  isFocusModalOpen: boolean;
  focusTargetTask: TaskItem | null;
  openFocusModal: (task?: TaskItem | null) => void;
  closeFocusModal: () => void;
  recordCompletedFocus: (durationSeconds: number, earnedXp: number) => void;

  // Task Inspector Drawer State
  inspectingTask: TaskItem | null;
  openTaskInspector: (task: TaskItem) => void;
  closeTaskInspector: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [domains, setDomains] = useState<LifeDomainItem[]>(INITIAL_DOMAINS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(null);

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTargetTask, setFocusTargetTask] = useState<TaskItem | null>(null);

  const [inspectingTask, setInspectingTask] = useState<TaskItem | null>(null);

  // Recalculate rank on XP changes
  const addXP = (amount: number, domainId?: string) => {
    setUser((prev) => {
      const newTotal = prev.totalXp + amount;
      const rank = calculateUserRank(newTotal);
      return {
        ...prev,
        totalXp: newTotal,
        rankTier: rank.tier,
        rankTitle: rank.title,
        tierProgress: rank.progressPercent,
        nextTierXp: rank.maxXp,
      };
    });

    if (domainId) {
      setDomains((prev) =>
        prev.map((d) => {
          if (d.id === domainId) {
            const updatedXp = d.currentXp + amount;
            return {
              ...d,
              currentXp: updatedXp,
            };
          }
          return d;
        })
      );
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          if (nextCompleted) {
            addXP(t.xpReward, t.domainId);
          } else {
            addXP(-t.xpReward, t.domainId);
          }
          return {
            ...t,
            isCompleted: nextCompleted,
            columnId: nextCompleted ? "DONE" : "TODO",
            doneAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return t;
      })
    );

    // Persist to Neon DB asynchronously via Server Action
    import("@/actions/tasks").then(({ toggleTaskCompleteAction }) => {
      toggleTaskCompleteAction(taskId).catch(console.error);
    });
  };

  const addTask = (
    domainId: string,
    title: string,
    estimatedMinutes?: number,
    xpReward: number = 25
  ) => {
    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      domainId,
      title,
      columnId: "TODO",
      isCompleted: false,
      xpReward,
      estimatedMinutes: estimatedMinutes || null,
      sortOrder: tasks.length + 1,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Persist to Neon DB asynchronously via Server Action
    import("@/actions/tasks").then(({ createTaskAction }) => {
      createTaskAction({ domainId, title, estimatedMinutes, xpReward }).catch(console.error);
    });
  };

  const updateTask = (updated: Partial<TaskItem> & { id: string }) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
    if (inspectingTask && inspectingTask.id === updated.id) {
      setInspectingTask((prev) => (prev ? { ...prev, ...updated } : null));
    }

    if (updated.columnId) {
      import("@/actions/tasks").then(({ updateTaskColumnAction }) => {
        updateTaskColumnAction(updated.id, updated.columnId!).catch(console.error);
      });
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (inspectingTask?.id === taskId) {
      setInspectingTask(null);
    }
  };

  const openFocusModal = (task?: TaskItem | null) => {
    setFocusTargetTask(task || null);
    setIsFocusModalOpen(true);
  };

  const closeFocusModal = () => {
    setIsFocusModalOpen(false);
  };

  const recordCompletedFocus = (durationSeconds: number, earnedXp: number) => {
    addXP(earnedXp, focusTargetTask?.domainId);
    if (focusTargetTask) {
      toggleTaskComplete(focusTargetTask.id);
    }

    // Persist focus session to Neon DB via Server Action
    import("@/actions/focus").then(({ recordFocusSessionAction }) => {
      recordFocusSessionAction({
        taskId: focusTargetTask?.id || null,
        durationSeconds,
        verifiedXp: earnedXp,
        startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      }).catch(console.error);
    });
  };

  const openTaskInspector = (task: TaskItem) => {
    setInspectingTask(task);
  };

  const closeTaskInspector = () => {
    setInspectingTask(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        domains,
        tasks,
        selectedDomainSlug,
        setSelectedDomainSlug,
        toggleTaskComplete,
        addTask,
        updateTask,
        deleteTask,
        isFocusModalOpen,
        focusTargetTask,
        openFocusModal,
        closeFocusModal,
        recordCompletedFocus,
        inspectingTask,
        openTaskInspector,
        closeTaskInspector,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
