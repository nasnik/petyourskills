"use client";

import React from "react";
import { CalendarEvent } from "@/lib/calendar/expand-events";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

interface CalendarEventChipProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  onToggleComplete?: (taskId: string) => void;
  compact?: boolean; // month view = smaller chip
}

export function CalendarEventChip({
  event,
  onClick,
  onToggleComplete,
  compact = false,
}: CalendarEventChipProps) {
  if (compact) {
    // Month view: just a colored dot + truncated title
    return (
      <div
        onClick={() => onClick(event)}
        title={event.title}
        className="group w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.(event.taskId);
          }}
          className="shrink-0 p-0.5 rounded hover:scale-125 transition-transform"
          title={event.isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {event.isCompleted ? (
            <CheckCircle2
              size={11}
              className="shrink-0"
              style={{ color: event.accentColor }}
            />
          ) : (
            <span
              className="block shrink-0 w-1.5 h-1.5 rounded-full border border-current"
              style={{ backgroundColor: event.accentColor, borderColor: event.accentColor }}
            />
          )}
        </button>
        <span
          className={cn(
            "text-[10px] font-mono truncate leading-tight",
            event.isCompleted ? "text-outline line-through" : "text-on-surface"
          )}
        >
          {event.title}
        </span>
      </div>
    );
  }

  // Week view: full chip with XP badge
  return (
    <div
      onClick={() => onClick(event)}
      className={cn(
        "group w-full flex items-center gap-2 px-2 py-1.5 rounded border transition-all cursor-pointer text-left",
        event.isCompleted
          ? "bg-white/3 border-white/5 opacity-60"
          : "bg-surface-container-low border-white/10 hover:border-white/20 hover:bg-surface-container"
      )}
      style={{
        borderLeftColor: event.accentColor,
        borderLeftWidth: "2px",
      }}
    >
      {/* Interactive completion toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete?.(event.taskId);
        }}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
        title={event.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {event.isCompleted ? (
          <CheckCircle2
            size={13}
            className="shrink-0"
            style={{ color: event.accentColor }}
          />
        ) : (
          <span
            className="block shrink-0 w-2.5 h-2.5 rounded-full border border-current opacity-60 group-hover:opacity-100 hover:scale-110 transition-all"
            style={{ borderColor: event.accentColor }}
          />
        )}
      </button>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-[11px] font-mono truncate leading-tight",
          event.isCompleted
            ? "text-outline line-through"
            : "text-on-surface group-hover:text-white"
        )}
      >
        {event.title}
      </span>

      {/* Estimated time */}
      {event.estimatedMinutes && !event.isCompleted && (
        <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono text-outline">
          <Clock size={9} />
          {event.estimatedMinutes}m
        </span>
      )}

      {/* XP Badge */}
      <span
        className="shrink-0 text-[9px] font-mono font-bold px-1 py-0.5 rounded"
        style={{
          backgroundColor: `${event.accentColor}20`,
          color: event.accentColor,
        }}
      >
        +{event.xpReward}
      </span>
    </div>
  );
}
