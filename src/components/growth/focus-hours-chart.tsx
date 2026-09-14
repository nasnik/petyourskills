"use client";

import React from "react";
import { useApp } from "@/lib/store/app-context";
import { getDailyFocusData, type Timeframe } from "@/lib/growth-analytics";

interface FocusHoursChartProps {
  timeframe: Timeframe;
}

export function FocusHoursChart({ timeframe }: FocusHoursChartProps) {
  const { focusSessions, tasks, domains } = useApp();
  const chartData = getDailyFocusData(focusSessions, tasks, domains, timeframe);

  const maxTotalHours = Math.max(...chartData.map(d => d.totalHours), 1);
  
  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Daily Domain Focus Hours
          </h3>
          <p className="text-xs text-outline font-mono mt-0.5">
            Distribution of concentrated work over the selected period
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-wellness-emerald" />
            <span className="text-on-surface">Health</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-work-electric-blue" />
            <span className="text-on-surface">Work</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-learning-violet" />
            <span className="text-on-surface">Learning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-hobbies-orange" />
            <span className="text-on-surface">Volunteering</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-white/10">
        {chartData.map((item) => (
          <div
            key={item.day}
            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
          >
            {/* Tooltip on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-white bg-surface-bright px-1.5 py-0.5 rounded mb-1 whitespace-nowrap">
              {item.totalHours}h
            </div>

            {/* Stacked bar */}
            <div className="w-full max-w-[48px] bg-surface-container-low rounded-t flex flex-col-reverse overflow-hidden h-[180px] justify-start transition-all group-hover:brightness-110">
              {item.health > 0 && (
                <div
                  style={{ height: `${item.health}%` }}
                  className="w-full bg-wellness-emerald shrink-0"
                />
              )}
              {item.work > 0 && (
                <div
                  style={{ height: `${item.work}%` }}
                  className="w-full bg-work-electric-blue shrink-0"
                />
              )}
              {item.learning > 0 && (
                <div
                  style={{ height: `${item.learning}%` }}
                  className="w-full bg-learning-violet shrink-0"
                />
              )}
              {item.volunteering > 0 && (
                <div
                  style={{ height: `${item.volunteering}%` }}
                  className="w-full bg-hobbies-orange shrink-0"
                />
              )}
              {(item.health === 0 && item.work === 0 && item.learning === 0 && item.volunteering === 0) && (
                <div className="w-full h-2 bg-white/5 shrink-0" />
              )}
            </div>

            <span
              className={`text-xs font-mono mt-2 ${
                item.date.toDateString() === new Date().toDateString()
                  ? "text-wellness-emerald font-bold"
                  : "text-outline"
              }`}
            >
              {item.day}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-outline">
        <span>0.0h Baseline</span>
        <span>Average: {Math.round((chartData.reduce((a, b) => a + b.totalHours, 0) / chartData.length) * 10) / 10}h / day</span>
        <span className="text-wellness-emerald font-semibold">
          Max: {Math.max(...chartData.map(d => d.totalHours))}h
        </span>
      </div>
    </div>
  );
}
