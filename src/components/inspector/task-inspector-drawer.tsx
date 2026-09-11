"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/store/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFriendlyDate } from "@/components/shared/skill-schedule-config";

export function TaskInspectorDrawer() {
  const {
    inspectingTask,
    closeTaskInspector,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    domains,
  } = useApp();

  const [title, setTitle] = useState("");
  const [xpReward, setXpReward] = useState(25);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);

  useEffect(() => {
    if (inspectingTask) {
      setTitle(inspectingTask.title);
      setXpReward(inspectingTask.xpReward || 25);
      setEstimatedMinutes(inspectingTask.estimatedMinutes || 30);
    }
  }, [inspectingTask]);

  if (!inspectingTask) return null;

  const domain =
    domains.find((d) => d.id === inspectingTask.domainId) || domains[0];

  const handleSave = () => {
    updateTask({
      id: inspectingTask.id,
      title,
      xpReward,
      estimatedMinutes,
    });
    closeTaskInspector();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this quest?")) {
      deleteTask(inspectingTask.id);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-obsidian-deep/70 backdrop-blur-sm animate-in fade-in-10 duration-200">
      <div
        className="w-full max-w-xl h-full bg-charcoal-surface border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right-10 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: domain?.accentColor }}
            />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
              {domain?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              Active Inspector Mode
            </Badge>
            <button
              onClick={closeTaskInspector}
              className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-outline hover:text-white hover:border-white/30 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Companion Overview Card */}
          <div
            className="rounded border p-4 relative overflow-hidden"
            style={{
              backgroundColor: `${domain?.accentColor}0a`,
              borderColor: `${domain?.accentColor}33`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border"
                  style={{
                    backgroundColor: `${domain?.accentColor}22`,
                    borderColor: `${domain?.accentColor}66`,
                    color: domain?.accentColor,
                  }}
                >
                  {domain?.avatarSpecies.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">
                      {domain?.avatarSpecies}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Lv. {domain?.level}
                    </Badge>
                  </div>
                  <span className="text-xs text-outline font-mono">
                    Tier 2 Companion · Empowered by daily consistency
                  </span>
                </div>
              </div>

              <span
                className="text-xs font-mono px-2 py-1 rounded font-semibold"
                style={{
                  color: domain?.accentColor,
                  backgroundColor: `${domain?.accentColor}20`,
                }}
              >
                +1,400 XP / cycle
              </span>
            </div>

            {/* Level progression bar */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[11px] font-mono text-outline">
                <span>Companion Level {domain?.level} → {domain?.level + 1}</span>
                <span>{domain?.currentXp} / 4,000 XP (85%)</span>
              </div>
              <div className="w-full bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: "85%",
                    backgroundColor: domain?.accentColor,
                    boxShadow: `0 0 10px ${domain?.accentColor}`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                Task Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quest or habit name..."
                className="text-base font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                  XP Reward
                </label>
                <div className="flex items-center gap-2 bg-obsidian-deep border border-surface-bright rounded px-3 py-2">
                  <Zap size={14} className="text-wellness-emerald" />
                  <input
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    className="w-full bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                  <span className="text-xs font-mono text-outline">XP</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                  Focus Estimate
                </label>
                <div className="flex items-center gap-2 bg-obsidian-deep border border-surface-bright rounded px-3 py-2">
                  <Clock size={14} className="text-outline" />
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                  <span className="text-xs font-mono text-outline">min</span>
                </div>
              </div>
            </div>

            {/* Date and Completion Log */}
            <div className="p-3.5 bg-obsidian-deep border border-white/10 rounded space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-outline flex items-center gap-1.5">
                  <Calendar size={13} />
                  Schedule / Date:
                </span>
                <span className="text-white font-medium">
                  {inspectingTask.repeatConfig?.specificDate
                    ? formatFriendlyDate(inspectingTask.repeatConfig.specificDate)
                    : inspectingTask.repeatConfig?.startDate && inspectingTask.repeatConfig?.endDate
                    ? `${formatFriendlyDate(inspectingTask.repeatConfig.startDate)} → ${formatFriendlyDate(inspectingTask.repeatConfig.endDate)}`
                    : inspectingTask.repeatConfig?.customDates?.length
                    ? `${inspectingTask.repeatConfig.customDates.length} Specific Dates`
                    : inspectingTask.repeatConfig?.scheduleType === "weekdays"
                    ? "Weekdays (M-F)"
                    : inspectingTask.repeatConfig?.scheduleType === "weekends"
                    ? "Weekends (Sat-Sun)"
                    : inspectingTask.repeatConfig?.days?.length
                    ? inspectingTask.repeatConfig.days.join(", ")
                    : "Daily Routine"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/5">
                <span className="text-outline">Completion Status:</span>
                {inspectingTask.isCompleted ? (
                  <span className="text-wellness-emerald flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    COMPLETED AT: 17:38
                  </span>
                ) : (
                  <span className="text-outline">PENDING LOG</span>
                )}
              </div>
            </div>

            {/* Toggle Complete button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toggleTaskComplete(inspectingTask.id)}
                className={cn(
                  "w-full py-2.5 px-4 rounded border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  inspectingTask.isCompleted
                    ? "bg-wellness-emerald/15 text-wellness-emerald border-wellness-emerald/40 hover:bg-wellness-emerald/25"
                    : "bg-surface-container-high text-white border-white/10 hover:border-white/30"
                )}
              >
                <CheckCircle2 size={16} />
                <span>
                  {inspectingTask.isCompleted
                    ? "Mark as Pending (Undo)"
                    : "Mark Done (+XP Award)"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between bg-surface-container-lowest">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs text-danger-red hover:text-danger-red/80 font-mono transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete Quest</span>
          </button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeTaskInspector}
            >
              Revert
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
