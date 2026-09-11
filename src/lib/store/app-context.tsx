"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import { LifeDomainItem, TaskItem, UserProfile } from "@/types";
import { INITIAL_DOMAINS, INITIAL_TASKS, INITIAL_USER_PROFILE } from "@/lib/mock-data";
import { calculateUserRank } from "@/lib/gamification/xp-engine";

export interface AddSkillOrTaskParams {
  domainId?: string;
  domainSlug?: string;
  domainName?: string;
  domainColor?: string;
  avatarSpecies?: string;
  title: string;
  estimatedMinutes?: number | null;
  xpReward?: number;
  repeatConfig?: TaskItem["repeatConfig"];
  createCompanionPet?: boolean;
  planningEngine?: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
}

interface AppContextType {
  user: UserProfile;
  domains: LifeDomainItem[];
  tasks: TaskItem[];
  selectedDomainSlug: string | null;
  setSelectedDomainSlug: (slug: string | null) => void;
  toggleTaskComplete: (taskId: string) => void;
  addTask: (domainId: string, title: string, estimatedMinutes?: number, xpReward?: number) => void;
  addSkillOrTask: (params: AddSkillOrTaskParams) => void;
  addProjectSubtask: (params: {
    boardId: string;
    domainId: string;
    title: string;
    columnId?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    xpReward?: number;
    estimatedMinutes?: number;
  }) => void;
  updateTask: (task: Partial<TaskItem> & { id: string }) => void;
  deleteTask: (taskId: string) => void;

  // Live board sync: re-fetch a shared project's cards from the server and
  // merge them into local state (used by the board poller so collaborators
  // see each other's changes without refreshing).
  refreshProjectTasks: (projectId: string, boardIds: string[]) => Promise<void>;

  // Active Multi-Task Project Kanban State
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

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

  // Create Skill / Task Modal State
  isCreateTaskModalOpen: boolean;
  createTaskTargetDomainId: string | null;
  openCreateTaskModal: (domainId?: string) => void;
  closeCreateTaskModal: () => void;

  // Guest Upgrade Modal State (anonymous collaborator → full account)
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: React.ReactNode;
  initialUser?: UserProfile;
  initialDomains?: LifeDomainItem[];
  initialTasks?: TaskItem[];
}

export function AppProvider({
  children,
  initialUser,
  initialDomains,
  initialTasks,
}: AppProviderProps) {
  const [user, setUser] = useState<UserProfile>(initialUser ?? INITIAL_USER_PROFILE);
  const [domains, setDomains] = useState<LifeDomainItem[]>(initialDomains ?? INITIAL_DOMAINS);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks ?? INITIAL_TASKS);
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(null);

  // Multi-Task Project Kanban Workspace state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTargetTask, setFocusTargetTask] = useState<TaskItem | null>(null);

  const [inspectingTask, setInspectingTask] = useState<TaskItem | null>(null);

  // Create Skill/Task Modal State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskTargetDomainId, setCreateTaskTargetDomainId] = useState<string | null>(null);

  // Guest Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const openCreateTaskModal = (domainId?: string) => {
    // Anonymous guests can't create personal skills — show the upgrade path
    if (user.isAnonymous) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setCreateTaskTargetDomainId(domainId ?? null);
    setIsCreateTaskModalOpen(true);
  };

  const closeCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false);
    setCreateTaskTargetDomainId(null);
  };

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

  const addSkillOrTask = ({
    domainId,
    domainSlug,
    domainName,
    domainColor,
    avatarSpecies,
    title,
    estimatedMinutes,
    xpReward = 25,
    repeatConfig,
    createCompanionPet = false,
    planningEngine = "DAILY_ROUTINE",
  }: AddSkillOrTaskParams) => {
    // Resolve target domain in state
    let targetDomainId = domainId;

    if (targetDomainId) {
      const existing = domains.find((d) => d.id === targetDomainId);
      if (existing) {
        if (avatarSpecies && existing.avatarSpecies !== avatarSpecies) {
          setDomains((prev) =>
            prev.map((d) => (d.id === targetDomainId ? { ...d, avatarSpecies } : d))
          );
        }
      }
    } else if (domainSlug) {
      const existingBySlug = domains.find((d) => d.slug === domainSlug);
      if (existingBySlug) {
        targetDomainId = existingBySlug.id;
        if (avatarSpecies && existingBySlug.avatarSpecies !== avatarSpecies) {
          setDomains((prev) =>
            prev.map((d) => (d.id === targetDomainId ? { ...d, avatarSpecies } : d))
          );
        }
      } else {
        // Create new domain in state
        const newDomainId = `dom-${domainSlug}-${user.id.slice(0, 8)}-${Date.now()}`;
        targetDomainId = newDomainId;
        const newDomainItem: LifeDomainItem = {
          id: newDomainId,
          userId: user.id,
          name: domainName || domainSlug,
          slug: domainSlug,
          accentColor: domainColor || "#10B981",
          avatarSpecies: avatarSpecies || "Vitality Wolf",
          level: 1,
          currentXp: 0,
          isActive: true,
          skillPets: [],
        };
        setDomains((prev) => [...prev, newDomainItem]);
      }
    } else if (domains.length > 0) {
      targetDomainId = domains[0].id;
    } else {
      targetDomainId = `dom-general-${Date.now()}`;
    }

    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      domainId: targetDomainId!,
      title,
      columnId: "TODO",
      isCompleted: false,
      xpReward,
      estimatedMinutes: estimatedMinutes ?? null,
      repeatConfig: { ...(repeatConfig || {}), engine: planningEngine },
      planningEngineType: planningEngine,
      sortOrder: tasks.length + 1,
    };

    // If multi-task project, create starter subtasks on this project board
    const starterTasks: TaskItem[] =
      planningEngine === "MULTI_TASK"
        ? [
            {
              id: `task-${Date.now()}-1`,
              domainId: targetDomainId!,
              boardId: tempId,
              title: `Milestone 1: Project Scope & Setup`,
              columnId: "TODO",
              isCompleted: false,
              xpReward: 30,
              estimatedMinutes: 25,
              sortOrder: 1,
            },
            {
              id: `task-${Date.now()}-2`,
              domainId: targetDomainId!,
              boardId: tempId,
              title: `Milestone 2: Core Implementation Sprint`,
              columnId: "IN_PROGRESS",
              isCompleted: false,
              xpReward: 50,
              estimatedMinutes: 45,
              sortOrder: 2,
            },
            {
              id: `task-${Date.now()}-3`,
              domainId: targetDomainId!,
              boardId: tempId,
              title: `Milestone 3: Quality Review & Testing`,
              columnId: "REVIEW",
              isCompleted: false,
              xpReward: 35,
              estimatedMinutes: 20,
              sortOrder: 3,
            },
          ]
        : [];

    setTasks((prev) => [...starterTasks, newTask, ...prev]);

    // If registered as companion skill pet, update local domain representation
    if (createCompanionPet || planningEngine) {
      setDomains((prev) =>
        prev.map((d) => {
          if (d.id === targetDomainId) {
            const currentPets = d.skillPets || [];
            return {
              ...d,
              skillPets: [
                ...currentPets,
                {
                  id: `pet-${targetDomainId}-${Date.now()}`,
                  domainId: targetDomainId!,
                  title,
                  level: 1,
                  currentXp: 0,
                  nextEvolutionThreshold: 1000,
                  planningEngineType: planningEngine,
                },
              ],
            };
          }
          return d;
        })
      );
    }

    // If this is a multi-task project, immediately open its Kanban workspace!
    if (planningEngine === "MULTI_TASK") {
      setActiveProjectId(tempId);
    }

    // Persist to Neon DB asynchronously via Server Action
    import("@/actions/tasks").then(({ createTaskAction }) => {
      createTaskAction({
        domainId: targetDomainId,
        domainSlug,
        domainName,
        domainColor,
        avatarSpecies,
        title,
        estimatedMinutes: estimatedMinutes ?? null,
        xpReward,
        planningEngine,
        repeatConfig,
        createCompanionPet,
      }).catch(console.error);
    });
  };

  const addProjectSubtask = ({
    boardId,
    domainId,
    title,
    columnId = "TODO",
    xpReward = 30,
    estimatedMinutes = 25,
  }: {
    boardId: string;
    domainId: string;
    title: string;
    columnId?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    xpReward?: number;
    estimatedMinutes?: number;
  }) => {
    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      domainId,
      boardId,
      title,
      columnId,
      isCompleted: columnId === "DONE",
      xpReward,
      estimatedMinutes: estimatedMinutes || null,
      sortOrder: tasks.length + 1,
    };

    setTasks((prev) => [...prev, newTask]);

    // Guests collaborate on a shared project: persist via the collaboration
    // action, which resolves the real owning domain server-side (the local
    // "dom-shared-*" id doesn't exist in the DB). On success, swap the
    // optimistic temp id for the real DB id so drag/delete updates persist.
    if (user.isAnonymous) {
      import("@/actions/collaboration").then(
        ({ addSharedProjectTaskAction }) => {
          addSharedProjectTaskAction({
            projectId: boardId,
            title,
            columnId,
            xpReward,
            estimatedMinutes,
          })
            .then((res) => {
              if (res?.success && res.taskId) {
                const realId = res.taskId;
                setTasks((prev) =>
                  prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t))
                );
              } else {
                console.error(
                  "Shared task was not persisted:",
                  res?.error ?? "unknown error"
                );
              }
            })
            .catch(console.error);
        }
      );
      return;
    }

    import("@/actions/tasks").then(({ createTaskAction }) => {
      createTaskAction({
        domainId,
        boardId,
        title,
        xpReward,
        estimatedMinutes,
      }).catch(console.error);
    });
  };

  const addTask = (
    domainId: string,
    title: string,
    estimatedMinutes?: number,
    xpReward: number = 25
  ) => {
    addSkillOrTask({
      domainId,
      title,
      estimatedMinutes,
      xpReward,
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

    if (updated.repeatConfig) {
      import("@/actions/tasks").then(({ updateTaskRepeatConfigAction }) => {
        updateTaskRepeatConfigAction(updated.id, updated.repeatConfig!).catch(console.error);
      });
    }
  };

  // Tracks recently deleted task ids so the board poller doesn't resurrect
  // a card whose server-side delete is still in flight.
  const recentlyDeletedRef = useRef<Map<string, number>>(new Map());

  const deleteTask = (taskId: string) => {
    recentlyDeletedRef.current.set(taskId, Date.now());
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDomains((prev) =>
      prev.map((d) => ({
        ...d,
        skillPets: d.skillPets?.filter((p) => p.id !== taskId),
      }))
    );
    if (inspectingTask?.id === taskId) {
      setInspectingTask(null);
    }
    if (activeProjectId === taskId) {
      setActiveProjectId(null);
    }
    import("@/actions/tasks").then(({ deleteTaskAction }) => {
      deleteTaskAction(taskId).catch(console.error);
    });
  };

  const refreshProjectTasks = async (projectId: string, boardIds: string[]) => {
    try {
      const { syncSharedProjectTasksAction } = await import(
        "@/actions/collaboration"
      );
      const res = await syncSharedProjectTasksAction({ projectId });
      if (!res?.success || !res.tasks) return;

      const fetched = res.tasks as TaskItem[];
      const fetchedIds = new Set(fetched.map((t) => t.id));
      const boardIdSet = new Set(boardIds);

      // Prune stale entries from the recent-delete tracker (>8s old)
      const recentlyDeleted = recentlyDeletedRef.current;
      const now = Date.now();
      recentlyDeleted.forEach((ts, id) => {
        if (now - ts > 8000) recentlyDeleted.delete(id);
      });

      setTasks((prev) => {
        // Keep everything that is NOT on this board, plus local optimistic
        // adds (temp ids) that haven't been swapped for a real id yet.
        const kept = prev.filter((t) => {
          const onBoard = t.boardId && boardIdSet.has(t.boardId);
          if (!onBoard) return true;
          const isTemp = /^task-\d{10,}$/.test(t.id);
          return isTemp && !fetchedIds.has(t.id);
        });
        // Skip cards deleted locally whose server delete is still in flight
        const merged = fetched.filter((t) => !recentlyDeleted.has(t.id));
        return [...kept, ...merged];
      });
    } catch (error) {
      console.error("Project sync failed:", error);
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
        addSkillOrTask,
        addProjectSubtask,
        updateTask,
        deleteTask,
        refreshProjectTasks,
        activeProjectId,
        setActiveProjectId,
        isFocusModalOpen,
        focusTargetTask,
        openFocusModal,
        closeFocusModal,
        recordCompletedFocus,
        inspectingTask,
        openTaskInspector,
        closeTaskInspector,
        isCreateTaskModalOpen,
        createTaskTargetDomainId,
        openCreateTaskModal,
        closeCreateTaskModal,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
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
