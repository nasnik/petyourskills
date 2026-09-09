"use client";

import React, { useState } from "react";
import { LifeDomainItem, TaskItem } from "@/types";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainAccordionProps {
  domain: LifeDomainItem;
  tasks: TaskItem[];
  isOpen: boolean;
  onToggle: () => void;
}

export function DomainAccordion({
  domain,
  tasks,
  isOpen,
  onToggle,
}: DomainAccordionProps) {
  const { toggleTaskComplete, addTask, openTaskInspector } = useApp();
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillTitle.trim()) return;
    addTask(domain.id, newSkillTitle.trim());
    setNewSkillTitle("");
    setIsAdding(false);
  };

  const domainLetter = domain.name.charAt(0);

  return (
    <div
      className={cn(
        "rounded border transition-all duration-200 overflow-hidden",
        isOpen
          ? "bg-charcoal-surface/70 border-white/20"
          : "bg-surface-container-lowest/40 border-white/5 hover:border-white/10"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0"
            style={{
              backgroundColor: `${domain.accentColor}22`,
              color: domain.accentColor,
              border: `1px solid ${domain.accentColor}44`,
            }}
          >
            {domainLetter}
          </div>
          <div className="min-w-0 truncate">
            <div className="text-sm font-semibold text-white truncate">
              {domain.name}
            </div>
            <div className="text-[11px] font-mono text-outline truncate">
              {domain.avatarSpecies} · Lv. {domain.level}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: domain.accentColor,
              boxShadow: `0 0 6px ${domain.accentColor}`,
            }}
          />
          <ChevronDown
            size={16}
            className={cn(
              "text-outline transition-transform duration-200",
              isOpen && "rotate-180 text-white"
            )}
          />
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2">
          {/* Quick Add Form */}
          {isAdding ? (
            <form onSubmit={handleCreateSkill} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSkillTitle}
                onChange={(e) => setNewSkillTitle(e.target.value)}
                placeholder="Enter skill or habit..."
                autoFocus
                className="w-full bg-obsidian-deep border border-white/20 rounded px-2.5 py-1 text-xs text-white placeholder:text-outline focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-white text-obsidian-deep text-xs font-semibold rounded shrink-0 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-outline hover:text-white px-1 cursor-pointer"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-mono text-outline hover:text-white hover:bg-white/5 rounded border border-dashed border-white/10 transition-colors cursor-pointer"
            >
              <Plus size={12} />
              <span>Add New Skill</span>
            </button>
          )}

          {/* Task / Skill List */}
          <div className="space-y-1.5 pt-1">
            {tasks.length === 0 ? (
              <div className="text-[11px] font-mono text-outline text-center py-2">
                No active habits in this domain.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => openTaskInspector(task)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2 rounded text-xs transition-all border cursor-pointer",
                    task.isCompleted
                      ? "bg-obsidian-deep/60 border-white/5 text-outline"
                      : "bg-obsidian-deep border-white/10 text-on-surface hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={task.isCompleted}
                      color={domain.accentColor}
                      size="sm"
                      onChange={() => toggleTaskComplete(task.id)}
                    />
                    <span
                      className={cn(
                        "truncate font-medium",
                        task.isCompleted && "line-through text-outline"
                      )}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                    style={{
                      color: domain.accentColor,
                      backgroundColor: `${domain.accentColor}15`,
                    }}
                  >
                    +{task.xpReward} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
