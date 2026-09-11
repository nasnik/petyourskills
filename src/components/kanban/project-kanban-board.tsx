"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useApp } from "@/lib/store/app-context";
import { TaskItem } from "@/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Zap,
  Sparkles,
  CheckCircle2,
  Layers,
  Edit3,
  KeyRound,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareModal } from "./share-modal";

const COLUMNS: {
  id: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  label: string;
  dotColor: string;
}[] = [
  { id: "TODO", label: "TO DO", dotColor: "#64748B" },
  { id: "IN_PROGRESS", label: "IN PROGRESS", dotColor: "#3B82F6" },
  { id: "REVIEW", label: "IN REVIEW", dotColor: "#F59E0B" },
  { id: "DONE", label: "DONE", dotColor: "#10B981" },
];

const AVATAR_EMOJIS: Record<string, string> = {
  "Vitality Wolf": "🐺",
  "Byte Fox": "🦊",
  "Wisdom Owl": "🦉",
  "Hydro Dragon": "🐉",
  "Aegis Turtle": "🐢",
  "Zenith Panther": "🐆",
  "Mystery Egg": "🥚",
  "byte-fox": "🦊",
  "wisdom-owl": "🦉",
  "hydro-dragon": "🐉",
  "vitality-wolf": "🐺",
  "aegis-turtle": "🐢",
  "zenith-panther": "🐆",
  "mystery-egg": "🥚",
};

interface ProjectKanbanBoardProps {
  projectId: string;
}

export function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
  const {
    tasks,
    domains,
    updateTask,
    deleteTask,
    addProjectSubtask,
    setActiveProjectId,
    openTaskInspector,
    refreshProjectTasks,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [inlineAddingCol, setInlineAddingCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Live-sync plumbing: latest function/ids via refs so the poller never
  // goes stale, and drag state so polls don't fight an in-flight drag.
  const syncRef = useRef(refreshProjectTasks);
  syncRef.current = refreshProjectTasks;
  const boardIdsRef = useRef<string[]>([]);
  const dragStateRef = useRef({ dragging: false, lastEnd: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find the project task or domain skill
  const projectTask = tasks.find((t) => t.id === projectId);
  const projectPet = domains
    .flatMap((d) => d.skillPets || [])
    .find((p) => p.id === projectId);

  const projectTitle =
    projectTask?.title || projectPet?.title || "Multi-Task Project";

  const domain =
    domains.find((d) => d.id === projectTask?.domainId) ||
    domains.find((d) => d.id === projectPet?.domainId) ||
    domains.find((d) =>
      d.skillPets?.some((p) => p.id === projectId || p.title === projectTitle)
    ) ||
    domains[0];

  const domainColor = domain?.accentColor || "#8B5CF6";
  const avatarName = domain?.avatarSpecies || "Companion";
  const avatarEmoji = AVATAR_EMOJIS[avatarName] || "🐾";

  // A project can exist as BOTH a SkillPet and a MULTI_TASK root task with
  // the same title — cards may be stored under EITHER id (host writes via the
  // id they opened, milestones via the root task, guests via their scoped id).
  // Resolve the full set of equivalent board ids so every card shows up
  // regardless of which id the board was opened with.
  const twinPet = domains
    .flatMap((d) => (d.skillPets || []).map((p) => ({ ...p, domainId: d.id })))
    .find(
      (p) =>
        p.planningEngineType === "MULTI_TASK" &&
        p.title.toLowerCase() === projectTitle.toLowerCase() &&
        (p.id === projectId || p.domainId === domain?.id)
    );
  const twinTask = tasks.find(
    (t) =>
      t.title.toLowerCase() === projectTitle.toLowerCase() &&
      t.domainId === domain?.id &&
      (t.planningEngineType === "MULTI_TASK" ||
        (t.repeatConfig as { engine?: string })?.engine === "MULTI_TASK" ||
        (t.repeatConfig as { frequency?: string })?.frequency === "multi_task")
  );

  const boardIds = new Set(
    [projectId, projectPet?.id, projectTask?.id, twinPet?.id, twinTask?.id].filter(
      (v): v is string => !!v
    )
  );

  // Filter tasks that belong to this board
  const boardTasks = tasks.filter(
    (t) =>
      (t.boardId && boardIds.has(t.boardId)) ||
      (t.id !== projectId &&
        t.domainId === domain?.id &&
        t.boardId === undefined &&
        !t.repeatConfig?.engine)
  );

  const doneCount = boardTasks.filter((t) => t.columnId === "DONE").length;
  const totalCount = boardTasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Live sync: poll the server for this board's cards so the host and guests
  // see each other's changes without refreshing. Skipped while dragging (and
  // for a short grace period after) and while the tab is hidden.
  boardIdsRef.current = Array.from(boardIds);
  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      if (dragStateRef.current.dragging) return;
      if (Date.now() - dragStateRef.current.lastEnd < 2500) return;
      if (typeof document !== "undefined" && document.hidden) return;
      syncRef.current(projectId, boardIdsRef.current).catch(() => {});
    };
    const interval = setInterval(tick, 3000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
    };
  }, [mounted, projectId]);

  const onDragStart = () => {
    dragStateRef.current.dragging = true;
  };

  const onDragEnd = (result: DropResult) => {
    dragStateRef.current.dragging = false;
    dragStateRef.current.lastEnd = Date.now();

    const { destination, draggableId } = result;
    if (!destination) return;

    const newColumnId = destination.droppableId as
      | "TODO"
      | "IN_PROGRESS"
      | "REVIEW"
      | "DONE";
    const isCompleted = newColumnId === "DONE";

    updateTask({
      id: draggableId,
      columnId: newColumnId,
      isCompleted,
      doneAt: isCompleted ? new Date().toISOString() : null,
    });
  };

  const handleCreateSubtask = (
    columnId: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  ) => {
    if (!newCardTitle.trim()) return;

    addProjectSubtask({
      boardId: projectId,
      domainId: domain?.id || "default",
      title: newCardTitle.trim(),
      columnId,
      xpReward: 30,
      estimatedMinutes: 25,
    });

    setNewCardTitle("");
    setInlineAddingCol(null);
  };

  const handleDeleteCard = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (confirm("Delete this task from the project board?")) {
      deleteTask(taskId);
    }
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center font-mono text-outline text-xs">
        Initializing multi-task Kanban workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-20 duration-200">
      {/* Top Navigation & Project Header Bar */}
      <div className="flex flex-col gap-4">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveProjectId(null)}
            className="inline-flex items-center gap-2 text-xs font-mono text-outline hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-outline">
            <span>DISCIPLINE MATRIX:</span>
            <span
              className="font-bold flex items-center gap-1"
              style={{ color: domainColor }}
            >
              <span>{avatarEmoji}</span>
              <span>{avatarName}</span>
            </span>
          </div>
        </div>

        {/* Main Project Card Banner */}
        <div className="bg-charcoal-surface border border-white/10 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          {/* Glowing accent border top */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: domainColor }}
          />

          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border shadow-md shrink-0"
              style={{
                backgroundColor: `${domainColor}20`,
                borderColor: `${domainColor}50`,
                boxShadow: `0 0 20px ${domainColor}30`,
              }}
            >
              {avatarEmoji}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${domainColor}20`,
                    color: domainColor,
                    border: `1px solid ${domainColor}40`,
                  }}
                >
                  {domain?.name || "Multi-Task Project"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white flex items-center gap-1">
                  <Layers size={11} />
                  <span>Multi-Task Kanban Project</span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight font-hanken mt-1">
                {projectTitle}
              </h1>
              <p className="text-xs font-mono text-outline mt-0.5">
                4-column sprint board. Drag cards to update status and channel XP into {avatarName}.
              </p>
            </div>
          </div>

          {/* Progress & Quick Actions */}
          <div className="flex items-center gap-5 shrink-0">
            {/* Progress metric */}
            <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5 text-xs font-mono text-outline">
                <span>Progress:</span>
                <span className="font-bold text-white">
                  {doneCount}/{totalCount} Completed
                </span>
              </div>
              <div className="w-32 bg-obsidian-deep h-2 rounded-full overflow-hidden mt-1.5 border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: domainColor,
                    boxShadow: `0 0 8px ${domainColor}`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-outline mt-1">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Share & Passkey Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              title="Invite collaborators with a project passkey"
              className="h-10 px-4 rounded-lg bg-wellness-emerald/10 border border-wellness-emerald/40 text-wellness-emerald font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-wellness-emerald/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-98 transition-all cursor-pointer shrink-0"
            >
              <Share2 size={15} />
              <span>Share</span>
              <KeyRound size={13} className="opacity-70" />
            </button>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => setInlineAddingCol("TODO")}
              className="h-10 px-4 rounded-lg bg-white text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-white/90 active:scale-98 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Columns Kanban Grid */}
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = boardTasks.filter(
              (t) => t.columnId === col.id
            );
            const isAddingHere = inlineAddingCol === col.id;

            return (
              <div
                key={col.id}
                className="bg-surface-container-lowest/60 border border-white/10 rounded-xl p-3.5 flex flex-col min-h-[550px] shadow-md"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: col.dotColor,
                        boxShadow: `0 0 8px ${col.dotColor}`,
                      }}
                    />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      {col.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                      {columnTasks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setInlineAddingCol(isAddingHere ? null : col.id)
                      }
                      title="Add card to column"
                      className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline Fast Add Card */}
                {isAddingHere && (
                  <div className="mb-3 p-3 rounded-lg bg-charcoal-surface border border-white/20 animate-in fade-in-20 duration-150 space-y-2 shadow-lg">
                    <input
                      type="text"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Task objective..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateSubtask(col.id);
                        if (e.key === "Escape") setInlineAddingCol(null);
                      }}
                      className="w-full bg-obsidian-deep border border-white/15 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-wellness-emerald"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setInlineAddingCol(null)}
                        className="px-2 py-1 text-[11px] font-mono text-outline hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateSubtask(col.id)}
                        className="px-3 py-1 bg-white text-obsidian-deep font-bold text-[11px] font-mono rounded cursor-pointer hover:bg-white/90"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Droppable Card Lane */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2.5 min-h-[220px] rounded-lg transition-colors p-1",
                        snapshot.isDraggingOver && "bg-white/5"
                      )}
                    >
                      {columnTasks.length === 0 && !isAddingHere && (
                        <div
                          onClick={() => setInlineAddingCol(col.id)}
                          className="h-28 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-outline hover:text-white hover:border-white/20 transition-colors cursor-pointer text-xs font-mono gap-1"
                        >
                          <Plus size={14} />
                          <span>Add card</span>
                        </div>
                      )}

                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => openTaskInspector(task)}
                              className={cn(
                                "p-3.5 rounded-lg border bg-charcoal-surface space-y-2.5 transition-all cursor-grab active:cursor-grabbing select-none group relative shadow",
                                dragSnapshot.isDragging
                                  ? "border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.8)] scale-[1.03] bg-surface-container-high z-30"
                                  : "border-white/10 hover:border-white/25 hover:bg-surface-container"
                              )}
                            >
                              {/* Card Title & Delete button */}
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className={cn(
                                    "text-xs font-semibold text-white leading-snug flex-1",
                                    task.isCompleted &&
                                      col.id === "DONE" &&
                                      "line-through text-outline"
                                  )}
                                >
                                  {task.title}
                                </h4>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCard(e, task.id)}
                                  title="Delete task"
                                  className="opacity-0 group-hover:opacity-100 text-outline hover:text-danger-red transition-all p-1 -mt-1 -mr-1 rounded hover:bg-white/5 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {/* Card Meta & XP Badge */}
                              <div className="flex items-center justify-between text-[10px] font-mono text-outline pt-1 border-t border-white/5">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={11} />
                                  <span>
                                    {task.estimatedMinutes
                                      ? `${task.estimatedMinutes}m`
                                      : "25m"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="px-1.5 py-0.2 rounded font-semibold text-wellness-emerald bg-wellness-emerald/15 border border-wellness-emerald/30 flex items-center gap-0.5"
                                  >
                                    <Zap size={10} className="fill-wellness-emerald" />
                                    <span>+{task.xpReward} XP</span>
                                  </span>

                                  <span className="opacity-0 group-hover:opacity-100 text-outline hover:text-white transition-opacity">
                                    <Edit3 size={11} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Bottom Quick Add Card Button */}
                {!isAddingHere && (
                  <button
                    type="button"
                    onClick={() => setInlineAddingCol(col.id)}
                    className="w-full mt-2 py-1.5 rounded text-xs font-mono text-outline hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <Plus size={13} />
                    <span>Add a card</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Share & Passkey Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectTitle={projectTitle}
        projectId={projectId}
      />
    </div>
  );
}
