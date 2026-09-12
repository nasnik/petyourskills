"use client";

import React, { useMemo } from "react";
import { useApp } from "@/lib/store/app-context";
import { Play, Clock, CheckCircle, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTimeStatsProps {
  timeframe: "Day" | "Week" | "Month" | "Year";
}

export function ProjectTimeStats({ timeframe }: ProjectTimeStatsProps) {
  const { focusSessions, tasks, domains, openFocusModal } = useApp();

  const timeframeMs = useMemo(() => {
    const now = Date.now();
    switch (timeframe) {
      case "Day": return 24 * 60 * 60 * 1000;
      case "Week": return 7 * 24 * 60 * 60 * 1000;
      case "Month": return 30 * 24 * 60 * 60 * 1000;
      case "Year": return 365 * 24 * 60 * 60 * 1000;
    }
  }, [timeframe]);

  const filteredSessions = useMemo(() => {
    const cutoff = Date.now() - timeframeMs;
    return focusSessions.filter((s) => new Date(s.completedAt).getTime() >= cutoff);
  }, [focusSessions, timeframeMs]);

  const projectStats = useMemo(() => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const stats = new Map<string, { title: string; domainId: string; totalSeconds: number; sessions: number; totalXp: number }>();

    filteredSessions.forEach((s) => {
      if (!s.taskId) return;
      const task = taskMap.get(s.taskId);
      if (!task) return;
      const key = task.domainId;
      const existing = stats.get(key) || { title: "", domainId: key, totalSeconds: 0, sessions: 0, totalXp: 0 };
      existing.totalSeconds += s.durationSeconds;
      existing.sessions += 1;
      existing.totalXp += s.verifiedXp;
      if (!existing.title || existing.title === "") {
        const domain = domains.find((d) => d.id === key);
        existing.title = domain?.name || "Unknown";
      }
      stats.set(key, existing);
    });

    return stats;
  }, [filteredSessions, tasks, domains]);

  const totalSeconds = useMemo(() => {
    let sum = 0;
    projectStats.forEach((s) => { sum += s.totalSeconds; });
    return sum;
  }, [projectStats]);

  const totalSessions = useMemo(() => {
    let sum = 0;
    projectStats.forEach((s) => { sum += s.sessions; });
    return sum;
  }, [projectStats]);

  const totalXp = useMemo(() => {
    let sum = 0;
    projectStats.forEach((s) => { sum += s.totalXp; });
    return sum;
  }, [projectStats]);

  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const sortedStats = useMemo(() => {
    return Array.from(projectStats.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [projectStats]);

  const topProject = sortedStats[0];
  const avgDuration = totalSessions > 0 ? Math.floor(totalSeconds / totalSessions) : 0;

  if (sortedStats.length === 0) {
    return (
      <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            Project & Skill Time Breakdown
          </h3>
        </div>
        <p className="text-xs text-outline font-mono text-center py-4">No focus sessions in this timeframe yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-tight">
          Project & Skill Time Breakdown
        </h3>
      </div>

      <div className="space-y-3">
        {sortedStats.map((item) => {
          const domain = domains.find((d) => d.id === item.domainId);
          const accent = domain?.accentColor || "#10B981";
          const percentage = totalSeconds > 0 ? (item.totalSeconds / totalSeconds) * 100 : 0;

          return (
            <div
              key={item.domainId}
              className="p-4 rounded border border-white/5 bg-surface-container-lowest/60 hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                    <span className="text-[10px] font-mono text-outline">
                      {item.sessions} session{item.sessions !== 1 ? "s" : ""} · {formatHours(item.totalSeconds)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const task = tasks.find((t) => t.domainId === item.domainId);
                    if (task) openFocusModal(task);
                  }}
                  className="opacity-0 hover:opacity-100 p-1 rounded text-wellness-emerald hover:bg-wellness-emerald/15 transition-all cursor-pointer shrink-0"
                  title="Start focus on this project"
                >
                  <Play size={13} className="fill-wellness-emerald" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: accent,
                      boxShadow: `0 0 8px ${accent}`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-outline shrink-0">{percentage.toFixed(0)}%</span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] font-mono text-outline flex items-center gap-1">
                  <Clock size={10} /> {formatHours(item.totalSeconds)}
                </span>
                <span className="text-[10px] font-mono text-outline flex items-center gap-1">
                  <CheckCircle size={10} /> {item.sessions} sessions
                </span>
                <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: accent }}>
                  <Zap size={10} /> +{item.totalXp} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-outline">
          <Target size={12} />
          <span>Top: {topProject?.title}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-outline">
          <span>Avg: {Math.floor(avgDuration / 60)}m/session</span>
          <span className="text-wellness-emerald font-semibold">+{totalXp} XP total</span>
        </div>
      </div>
    </div>
  );
}