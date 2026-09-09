"use client";

import React from "react";
import { TaskItem } from "@/types";
import { useApp } from "@/lib/store/app-context";
import { Clock, Star, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: TaskItem;
  isDragging?: boolean;
}

export function KanbanCard({ task, isDragging }: KanbanCardProps) {
  const { openTaskInspector, domains } = useApp();
  const domain = domains.find((d) => d.id === task.domainId) || domains[0];

  const getTag = () => {
    if (task.title.toLowerCase().includes("wireframe") || task.title.toLowerCase().includes("design")) {
      return { label: "DESIGN", color: "text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30" };
    }
    if (task.title.toLowerCase().includes("middleware") || task.title.toLowerCase().includes("backend")) {
      return { label: "BACKEND", color: "text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30" };
    }
    if (task.title.toLowerCase().includes("onboarding") || task.title.toLowerCase().includes("email")) {
      return { label: "COPY", color: "text-[#64748B] bg-[#64748B]/20 border-[#64748B]/40" };
    }
    if (task.title.toLowerCase().includes("deploy") || task.title.toLowerCase().includes("vercel")) {
      return { label: "SETUP", color: "text-[#64748B] bg-[#64748B]/20 border-[#64748B]/40" };
    }
    return { label: "FRONTEND", color: "text-[#3B82F6] bg-[#3B82F6]/15 border-[#3B82F6]/30" };
  };

  const tag = getTag();

  return (
    <div
      onClick={() => openTaskInspector(task)}
      className={cn(
        "bg-charcoal-surface border border-white/10 rounded p-3.5 space-y-2.5 transition-all cursor-grab active:cursor-grabbing select-none",
        isDragging
          ? "border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.8)] scale-[1.02] bg-surface-container-high"
          : "hover:border-white/25 hover:bg-surface-container"
      )}
    >
      {/* Top Tag Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider border",
            tag.color
          )}
        >
          {tag.label}
        </span>
        {task.title.toLowerCase().includes("middleware") && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-danger-red/15 text-danger-red border border-danger-red/30 font-semibold">
            URGENT
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-white leading-snug">
        {task.title}
      </h4>

      {/* Bottom Meta */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-outline">
        <div className="flex items-center gap-1.5">
          {task.columnId === "IN_PROGRESS" ? (
            <span className="text-work-electric-blue flex items-center gap-1 font-semibold">
              <RefreshCw size={11} className="animate-spin" />
              Working ({task.estimatedMinutes || 45}m)
            </span>
          ) : task.columnId === "DONE" ? (
            <span className="text-wellness-emerald">Completed today</span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {task.estimatedMinutes ? `${task.estimatedMinutes}m` : "2h 30m"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[#F59E0B] font-semibold">
          <Star size={11} className="fill-[#F59E0B]" />
          <span>{task.xpReward} XP</span>
        </div>
      </div>
    </div>
  );
}
