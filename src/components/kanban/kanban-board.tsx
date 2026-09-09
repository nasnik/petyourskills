"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useApp } from "@/lib/store/app-context";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Users, User, Plus, Share2, FolderKanban } from "lucide-react";
import { ShareModal } from "./share-modal";

const COLUMNS: { id: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"; label: string; dotColor: string }[] = [
  { id: "TODO", label: "TO DO", dotColor: "#64748B" },
  { id: "IN_PROGRESS", label: "IN PROGRESS", dotColor: "#3B82F6" },
  { id: "REVIEW", label: "REVIEW", dotColor: "#F59E0B" },
  { id: "DONE", label: "DONE", dotColor: "#10B981" },
];

export function KanbanBoard() {
  const { tasks, updateTask, addTask, domains } = useApp();
  const [mode, setMode] = useState<"PERSONAL" | "GROUP">("PERSONAL");
  const [mounted, setMounted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newColumnId = destination.droppableId as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    const isCompleted = newColumnId === "DONE";

    updateTask({
      id: draggableId,
      columnId: newColumnId,
      isCompleted,
      doneAt: isCompleted ? new Date().toISOString() : null,
    });
  };

  const handleQuickAddTask = () => {
    const title = prompt("Enter title for new initiative or task:");
    if (!title?.trim()) return;
    const workDomain = domains.find((d) => d.slug === "work") || domains[0];
    addTask(workDomain.id, title.trim(), 45, 50);
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center font-mono text-outline text-xs">
        Initializing collaborative Kanban matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kanban Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-work-electric-blue/15 border border-work-electric-blue/30 flex items-center justify-center text-work-electric-blue shrink-0">
            <FolderKanban size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Pet Your Skills Initiatives
            </h2>
            <p className="text-xs text-outline font-mono">
              Manage active initiatives and long-term goals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Personal vs Group Switcher */}
          <div className="flex items-center p-1 bg-charcoal-surface border border-white/10 rounded">
            <button
              onClick={() => setMode("PERSONAL")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                mode === "PERSONAL"
                  ? "bg-white text-obsidian-deep font-semibold"
                  : "text-outline hover:text-white"
              }`}
            >
              <User size={13} />
              <span>Personal</span>
            </button>
            <button
              onClick={() => setMode("GROUP")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                mode === "GROUP"
                  ? "bg-white text-obsidian-deep font-semibold"
                  : "text-outline hover:text-white"
              }`}
            >
              <Users size={13} />
              <span>Group</span>
            </button>
          </div>

          {mode === "GROUP" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="gap-1.5 font-mono text-xs"
            >
              <Share2 size={13} />
              <span>Share</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleQuickAddTask}
            className="gap-1.5 font-mono text-xs bg-white text-obsidian-deep font-semibold"
          >
            <Plus size={14} />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Kanban Drag & Drop Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.columnId === col.id);

            return (
              <div
                key={col.id}
                className="bg-surface-container-lowest/50 border border-white/5 rounded p-3 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.dotColor }}
                    />
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      {col.label}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-outline">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Droppable Card Lane */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 min-h-[200px] transition-colors rounded ${
                        snapshot.isDraggingOver ? "bg-white/5" : ""
                      }`}
                    >
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
                            >
                              <KanbanCard
                                task={task}
                                isDragging={dragSnapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
