"use client";

import React, { createContext, useContext, useState, useRef, useMemo, useCallback } from "react";
import { LifeDomainItem, TaskItem, UserProfile, FocusSessionItem, CommentItem } from "@/types";
import { INITIAL_DOMAINS, INITIAL_TASKS, INITIAL_USER_PROFILE } from "@/lib/mock-data";
import { calculateUserRank } from "@/lib/gamification/xp-engine";
import { isDailyPlanQuest, isSameDay } from "@/lib/schedule-utils";

export interface AddSkillOrTaskParams {
  domainId?: string;
  domainSlug?: string;
  domainName?: string;
  domainColor?: string;
  avatarSpecies?: string;
  title: string;
  description?: string | null;
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
    description?: string | null;
    columnId?: "TODO" | "IN_PROGRESS" | "DONE";
    xpReward?: number;
    estimatedMinutes?: number;
    assignee?: { id: string; name: string } | null;
  }) => void;
  updateTask: (task: Partial<TaskItem> & { id: string }) => void;
  deleteTask: (taskId: string) => void;
  updateMultiTaskProject: (projectId: string, updates: { title?: string; xpReward?: number; estimatedMinutes?: number | null; repeatConfig?: Record<string, unknown> }) => Promise<void>;

  // Live board sync: re-fetch a shared project's cards from the server and
  // merge them into local state (used by the board poller so collaborators
  // see each other's changes without refreshing).
  refreshProjectTasks: (projectId: string, boardIds: string[]) => Promise<void>;

  // Active Multi-Task Project Kanban State
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // Task description & comments
  updateTaskDescription: (taskId: string, description: string | null) => void;
  comments: Map<string, CommentItem[]>;
  loadTaskComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, body: string, authorName?: string) => void;
  updateGuestName: (name: string) => Promise<void>;

  // Focus Timer Overlay State
  isFocusModalOpen: boolean;
  focusTargetTask: TaskItem | null;
  focusSessions: FocusSessionItem[];
  openFocusModal: (task?: TaskItem | null) => void;
  closeFocusModal: () => void;
  setFocusTargetTask: (task: TaskItem | null) => void;
  recordCompletedFocus: (durationSeconds: number, earnedXp: number, targetTask?: TaskItem | null) => void;

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
  initialFocusSessions?: FocusSessionItem[];
}

export function AppProvider({
  children,
  initialUser,
  initialDomains,
  initialTasks,
  initialFocusSessions,
}: AppProviderProps) {
  const [user, setUser] = useState<UserProfile>(initialUser ?? INITIAL_USER_PROFILE);
  const [domains, setDomains] = useState<LifeDomainItem[]>(initialDomains ?? INITIAL_DOMAINS);
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const raw = initialTasks ?? INITIAL_TASKS;
    const now = new Date();
    return raw.map((t) => {
      if (t.isCompleted && isDailyPlanQuest(t) && !isSameDay(t.doneAt, now)) {
        return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
      }
      return t;
    });
  });
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(null);

  // Auto-reset daily routine and multi-task project completion when a new day begins
  React.useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      setTasks((prev) => {
        let changed = false;
        const updated = prev.map((t) => {
          if (t.isCompleted && isDailyPlanQuest(t) && !isSameDay(t.doneAt, now)) {
            changed = true;
            return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
          }
          return t;
        });
        return changed ? updated : prev;
      });
    };

    const interval = setInterval(checkMidnightReset, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate guest name from localStorage if session is anonymous and has generic name
  React.useEffect(() => {
    if (user.isAnonymous && (!user.callSign || user.callSign === "Guest Collaborator")) {
      try {
        const saved = localStorage.getItem("pys_guest_name");
        if (saved?.trim()) {
          setUser((prev) => ({ ...prev, callSign: saved.trim() }));
        }
      } catch {}
    }
  }, [user.isAnonymous, user.callSign]);

  // Multi-Task Project Kanban Workspace state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Task descriptions & comments state
  const [comments, setComments] = useState<Map<string, CommentItem[]>>(new Map());

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTargetTask, setFocusTargetTask] = useState<TaskItem | null>(null);
  const [focusSessions, setFocusSessions] = useState<FocusSessionItem[]>(initialFocusSessions ?? []);

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
    let doneAt: string | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          doneAt = nextCompleted ? new Date().toISOString() : null;
          if (nextCompleted) {
            addXP(t.xpReward, t.domainId);
          } else {
            addXP(-t.xpReward, t.domainId);
          }
          return {
            ...t,
            isCompleted: nextCompleted,
            columnId: nextCompleted ? "DONE" : "TODO",
            doneAt,
          };
        }
        return t;
      })
    );

    // Persist to Neon DB asynchronously via Server Action
    import("@/actions/tasks").then(({ toggleTaskCompleteAction }) => {
      toggleTaskCompleteAction(taskId, doneAt).catch(console.error);
    });
  };

  const addSkillOrTask = ({
    domainId,
    domainSlug,
    domainName,
    domainColor,
    avatarSpecies,
    title,
    description,
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
      description,
      columnId: "TODO",
      isCompleted: false,
      xpReward,
      estimatedMinutes: estimatedMinutes ?? null,
      repeatConfig: { ...(repeatConfig || {}), engine: planningEngine },
      planningEngineType: planningEngine,
      sortOrder: tasks.length + 1,
    };

    setTasks((prev) => [newTask, ...prev]);

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
        description: description || null,
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
    description,
    columnId = "TODO",
    xpReward = 30,
    estimatedMinutes = 25,
    assignee,
  }: {
    boardId: string;
    domainId: string;
    title: string;
    description?: string | null;
    columnId?: "TODO" | "IN_PROGRESS" | "DONE";
    xpReward?: number;
    estimatedMinutes?: number;
    assignee?: { id: string; name: string } | null;
  }) => {
    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      domainId,
      boardId,
      title,
      description,
      columnId,
      isCompleted: columnId === "DONE",
      xpReward,
      estimatedMinutes: estimatedMinutes || null,
      sortOrder: tasks.length + 1,
      assignee,
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
            description,
            columnId,
            xpReward,
            estimatedMinutes,
            assignee,
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
        description,
        xpReward,
        estimatedMinutes,
        assignee,
      })
        .then((res) => {
          if (res?.success && res.task?.id) {
            const realId = res.task.id;
            setTasks((prev) =>
              prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t))
            );
          }
        })
        .catch(console.error);
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

    const hasDetails =
      updated.title !== undefined ||
      updated.description !== undefined ||
      updated.xpReward !== undefined ||
      updated.estimatedMinutes !== undefined ||
      updated.assignee !== undefined;

    if (hasDetails) {
      import("@/actions/tasks").then(({ updateTaskDetailsAction }) => {
        updateTaskDetailsAction(updated.id, {
          title: updated.title,
          description: updated.description,
          xpReward: updated.xpReward,
          estimatedMinutes: updated.estimatedMinutes,
          assignee: updated.assignee
            ? { id: updated.assignee.id, name: updated.assignee.name }
            : updated.assignee === null
            ? null
            : undefined,
        }).catch(console.error);
      });
    }
  };

  const updateMultiTaskProject = async (
    projectId: string,
    updates: { title?: string; xpReward?: number; estimatedMinutes?: number | null; repeatConfig?: Record<string, unknown> }
  ) => {
    // Optimistically update local state
    if (updates.title !== undefined) {
      // Update skill pets in domains
      setDomains((prev) =>
        prev.map((d) => ({
          ...d,
          skillPets: d.skillPets?.map((p) =>
            p.id === projectId ? { ...p, title: updates.title! } : p
          ),
        }))
      );
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== projectId) return t;
        return {
          ...t,
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.xpReward !== undefined && { xpReward: updates.xpReward }),
          ...(updates.estimatedMinutes !== undefined && { estimatedMinutes: updates.estimatedMinutes }),
          ...(updates.repeatConfig !== undefined && { repeatConfig: updates.repeatConfig }),
        };
      })
    );
    // Persist to server
    const { updateMultiTaskProjectAction } = await import("@/actions/tasks");
    await updateMultiTaskProjectAction(projectId, updates).catch(console.error);
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
        
        // Merge: prefer local version if it has assignee/description and server doesn't yet
        const mergedWithLocal = merged.map((serverTask) => {
          const localTask = prev.find((t) => t.id === serverTask.id);
          if (!localTask) return serverTask;
          return {
            ...serverTask,
            assignee: localTask.assignee && !serverTask.assignee ? localTask.assignee : serverTask.assignee,
            description: localTask.description && !serverTask.description ? localTask.description : serverTask.description,
          };
        });
        
        return [...kept, ...mergedWithLocal];
      });
    } catch (error) {
      console.error("Project sync failed:", error);
    }
  };

  const updateTaskDescription = (taskId: string, description: string | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, description } : t))
    );
    if (inspectingTask && inspectingTask.id === taskId) {
      setInspectingTask((prev) => (prev ? { ...prev, description } : null));
    }
    import("@/actions/tasks").then(({ updateTaskDescriptionAction }) => {
      updateTaskDescriptionAction(taskId, description).catch(console.error);
    });
  };

  const loadTaskComments = useCallback(async (taskId: string) => {
    // Check cache first
    if (comments.has(taskId)) return;
    try {
      const mod = await import("@/actions/tasks");
      const res = await mod.getTaskCommentsAction(taskId);
      if (res.success && res.comments) {
        setComments((prev) => new Map(prev).set(taskId, res.comments as CommentItem[]));
      }
    } catch (err) {
      console.error("Failed to load task comments:", err);
    }
  }, [comments]);

  const updateGuestName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUser((prev) => ({ ...prev, callSign: trimmed }));
    try {
      localStorage.setItem("pys_guest_name", trimmed);
    } catch {}
    const { updateGuestNameAction } = await import("@/actions/collaboration");
    await updateGuestNameAction(trimmed).catch(console.error);
  };

  const addComment = (taskId: string, body: string, authorName?: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    const effectiveName =
      authorName?.trim() ||
      (user.callSign && user.callSign !== "Guest Collaborator" ? user.callSign : null) ||
      (user.isAnonymous ? "Guest Collaborator" : user.callSign || "Anonymous");

    // If an explicit authorName was supplied and user is anonymous, remember it in profile and storage
    if (authorName?.trim() && user.isAnonymous) {
      setUser((prev) => ({ ...prev, callSign: authorName.trim() }));
      try {
        localStorage.setItem("pys_guest_name", authorName.trim());
      } catch {}
    }

    // Optimistic comment
    const optimisticComment: CommentItem = {
      id: `cmt-${Date.now()}`,
      taskId,
      userId: user.isAnonymous ? (user.id || "guest") : user.id,
      userName: effectiveName,
      body: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setComments((prev) => {
      const existing = prev.get(taskId) || [];
      return new Map(prev).set(taskId, [...existing, optimisticComment]);
    });

    // Persist to DB
    import("@/actions/tasks").then(({ addTaskCommentAction }) => {
      addTaskCommentAction(taskId, trimmed, effectiveName).then((res) => {
        if (res.success && res.comment) {
          setComments((prev2) => {
            const existing = prev2.get(taskId) || [];
            const real = res.comment as CommentItem;
            const updated = existing.map((c) =>
              c.id === optimisticComment.id
                ? { ...c, id: real.id, userName: real.userName || c.userName }
                : c
            );
            return new Map(prev2).set(taskId, updated);
          });
        }
      }).catch(console.error);
    });
  };

  const openFocusModal = (task?: TaskItem | null) => {
    setFocusTargetTask(task || null);
    setIsFocusModalOpen(true);
  };

  const closeFocusModal = () => {
    setIsFocusModalOpen(false);
  };

  const recordCompletedFocus = (durationSeconds: number, earnedXp: number, targetTask?: TaskItem | null) => {
    const task = targetTask ?? focusTargetTask;
    addXP(earnedXp, task?.domainId);
    if (task) {
      toggleTaskComplete(task.id);
    }

    const newSession: FocusSessionItem = {
      id: `fs-${Date.now()}`,
      userId: user.id,
      taskId: task?.id || null,
      durationSeconds,
      verifiedXp: earnedXp,
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      task: task || null,
    };
    setFocusSessions((prev) => [newSession, ...prev]);

    // Persist focus session to Neon DB via Server Action
    import("@/actions/focus").then(({ recordFocusSessionAction }) => {
      recordFocusSessionAction({
        userId: user.id,
        taskId: task?.id || null,
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
        updateMultiTaskProject,
        refreshProjectTasks,
        activeProjectId,
        setActiveProjectId,
        updateTaskDescription,
        comments,
        loadTaskComments,
        addComment,
        updateGuestName,
        isFocusModalOpen,
        focusTargetTask,
        focusSessions,
        openFocusModal,
        closeFocusModal,
        setFocusTargetTask,
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
