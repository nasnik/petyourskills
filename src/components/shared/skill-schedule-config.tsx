"use client";

import React, { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  Check,
  Plus,
  X,
  Layers,
  RotateCcw,
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillRepeatConfig } from "@/types";

interface SkillScheduleConfigProps {
  engine: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
  config: SkillRepeatConfig;
  onChange: (config: SkillRepeatConfig) => void;
  accentColor?: string;
  className?: string;
}

// Helpers for formatted date strings (YYYY-MM-DD)
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function addDaysToString(baseDateStr: string, daysToAdd: number): string {
  const parts = baseDateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0];
}

export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextMondayString(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon ...
  const distance = (8 - dayOfWeek) % 7 || 7;
  const nextMon = new Date(today);
  nextMon.setDate(today.getDate() + distance);
  return nextMon.toISOString().split("T")[0];
}

const DAY_OPTIONS = [
  { id: "M", label: "M", full: "Monday" },
  { id: "T", label: "T", full: "Tuesday" },
  { id: "W", label: "W", full: "Wednesday" },
  { id: "Th", label: "Th", full: "Thursday" },
  { id: "F", label: "F", full: "Friday" },
  { id: "Sat", label: "Sat", full: "Saturday" },
  { id: "Sun", label: "Sun", full: "Sunday" },
];

const MULTI_TASK_PRESETS = [
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
];

export function SkillScheduleConfig({
  engine,
  config,
  onChange,
  accentColor = "#10B981",
  className,
}: SkillScheduleConfigProps) {
  const today = getTodayString();

  // Ref for the hidden date input used in custom_dates mode
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // 1. ONE-OFF: SPECIFIC DATE
  if (engine === "SPECIFIC_DATE") {
    const currentDate = config.specificDate || today;

    const setDate = (newDate: string) => {
      onChange({
        ...config,
        engine: "SPECIFIC_DATE",
        frequency: "specific_date",
        specificDate: newDate,
      });
    };

    return (
      <div
        className={cn(
          "p-3.5 rounded-xl border bg-obsidian-deep/80 space-y-3 animate-in fade-in-20 duration-150",
          className
        )}
        style={{ borderColor: `${accentColor}35` }}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
            <Calendar size={13} style={{ color: accentColor }} />
            <span>Event Date (One-Off Quest)</span>
          </label>
          <span className="text-[11px] font-mono font-medium" style={{ color: accentColor }}>
            {formatFriendlyDate(currentDate)}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-mono text-outline mr-1">Quick choose:</span>
          {[
            { label: "Today", value: today },
            { label: "Tomorrow", value: addDaysToString(today, 1) },
            { label: "In 3 Days", value: addDaysToString(today, 3) },
            { label: "Next Monday", value: getNextMondayString() },
          ].map((preset) => {
            const isSelected = currentDate === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDate(preset.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer",
                  isSelected
                    ? "text-white font-semibold shadow-sm"
                    : "bg-surface-container-lowest/60 border-white/10 text-outline hover:text-white hover:border-white/25"
                )}
                style={{
                  backgroundColor: isSelected ? `${accentColor}25` : undefined,
                  borderColor: isSelected ? accentColor : undefined,
                  color: isSelected ? accentColor : undefined,
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Exact Date Picker Input */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="relative flex-1">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
              className="w-full bg-charcoal-surface border border-white/15 focus:border-white/40 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. SCHEDULE: RECURRING DAYS OR MULTIPLE DATES
  if (engine === "CUSTOM_SCHEDULE") {
    const scheduleType = config.scheduleType || "weekdays";
    const selectedDays = config.days || ["M", "T", "W", "Th", "F"];
    const customDates = config.customDates || [];

    const handleSelectPreset = (type: "weekdays" | "weekends" | "days_of_week" | "custom_dates") => {
      if (type === "weekdays") {
        onChange({
          ...config,
          engine: "CUSTOM_SCHEDULE",
          frequency: "weekdays",
          scheduleType: "weekdays",
          days: ["M", "T", "W", "Th", "F"],
        });
      } else if (type === "weekends") {
        onChange({
          ...config,
          engine: "CUSTOM_SCHEDULE",
          frequency: "weekends",
          scheduleType: "weekends",
          days: ["Sat", "Sun"],
        });
      } else if (type === "days_of_week") {
        onChange({
          ...config,
          engine: "CUSTOM_SCHEDULE",
          frequency: "custom",
          scheduleType: "days_of_week",
          days: selectedDays.length > 0 ? selectedDays : ["M", "W", "F"],
        });
      } else if (type === "custom_dates") {
        onChange({
          ...config,
          engine: "CUSTOM_SCHEDULE",
          frequency: "custom",
          scheduleType: "custom_dates",
          customDates: customDates.length > 0 ? customDates : [],
        });
      }
    };

    const toggleDay = (dayId: string) => {
      const exists = selectedDays.includes(dayId);
      const nextDays = exists
        ? selectedDays.filter((d) => d !== dayId)
        : [...selectedDays, dayId];

      onChange({
        ...config,
        engine: "CUSTOM_SCHEDULE",
        frequency: "custom",
        scheduleType: "days_of_week",
        days: nextDays,
      });
    };

    const removeCustomDate = (dateToRemove: string) => {
      onChange({
        ...config,
        engine: "CUSTOM_SCHEDULE",
        frequency: "custom",
        scheduleType: "custom_dates",
        customDates: customDates.filter((d) => d !== dateToRemove),
      });
    };

    return (
      <div
        className={cn(
          "p-3.5 rounded-xl border bg-obsidian-deep/80 space-y-3 animate-in fade-in-20 duration-150",
          className
        )}
        style={{ borderColor: `${accentColor}35` }}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
            <CalendarDays size={13} style={{ color: accentColor }} />
            <span>Select Schedule</span>
          </label>

          <span className="text-[10px] font-mono text-outline">
            {scheduleType === "custom_dates"
              ? `${customDates.length} date${customDates.length === 1 ? "" : "s"} chosen`
              : `${selectedDays.length} day${selectedDays.length === 1 ? "" : "s"} / week`}
          </span>
        </div>

        {/* Schedule Mode Quick Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {[
            { id: "weekdays", label: "Weekdays (M-F)" },
            { id: "weekends", label: "Weekends (Sat-Sun)" },
            { id: "days_of_week", label: "Custom Days" },
            { id: "custom_dates", label: "Particular Multiple Dates" },
          ].map((mode) => {
            const isSelected = scheduleType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    mode.id as "weekdays" | "weekends" | "days_of_week" | "custom_dates"
                  )
                }
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer",
                  isSelected
                    ? "text-white font-semibold shadow-sm"
                    : "bg-surface-container-lowest/60 border-white/10 text-outline hover:text-white hover:border-white/25"
                )}
                style={{
                  backgroundColor: isSelected ? `${accentColor}25` : undefined,
                  borderColor: isSelected ? accentColor : undefined,
                  color: isSelected ? accentColor : undefined,
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* If Days of Week (M T W Th F Sat Sun) */}
        {scheduleType !== "custom_dates" && (
          <div className="pt-1">
            <div className="text-[10px] font-mono text-outline mb-1.5 flex items-center justify-between">
              <span>Choose Days (M T W Th F Sat Sun):</span>
              <span className="text-white/80">
                {selectedDays.length === 7
                  ? "Every day"
                  : selectedDays.join(", ") || "None selected"}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAY_OPTIONS.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    title={day.full}
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "h-9 rounded-lg font-mono text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer",
                      isSelected
                        ? "shadow-sm scale-102"
                        : "bg-charcoal-surface/80 border-white/10 text-outline hover:border-white/30 hover:text-white"
                    )}
                    style={{
                      backgroundColor: isSelected ? `${accentColor}25` : undefined,
                      borderColor: isSelected ? accentColor : undefined,
                      color: isSelected ? accentColor : undefined,
                    }}
                  >
                    <span>{day.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* If Particular Multiple Dates */}
        {scheduleType === "custom_dates" && (
          <div className="space-y-2.5 pt-1">
            {/* Hidden native date input — opened programmatically */}
            <input
              ref={hiddenDateInputRef}
              type="date"
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.value;
                if (!picked) return;
                if (!customDates.includes(picked)) {
                  const sorted = [...customDates, picked].sort();
                  onChange({
                    ...config,
                    engine: "CUSTOM_SCHEDULE",
                    frequency: "custom",
                    scheduleType: "custom_dates",
                    customDates: sorted,
                  });
                }
                // reset so same date can be re-picked after removal
                e.target.value = "";
              }}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  try {
                    hiddenDateInputRef.current?.showPicker();
                  } catch {
                    hiddenDateInputRef.current?.click();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: accentColor,
                  color: accentColor,
                }}
              >
                <Plus size={13} />
                <span>Add Date</span>
              </button>

              {customDates.length > 0 && (
                <span className="text-[10px] font-mono text-outline">
                  {customDates.length} date{customDates.length === 1 ? "" : "s"} selected
                </span>
              )}
            </div>

            {/* List of chosen dates */}
            <div className="space-y-1.5">
              {customDates.length === 0 ? (
                <p className="text-[11px] font-mono text-outline italic py-1">
                  Click &quot;Add Date&quot; to open the calendar and pick dates.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {customDates.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-charcoal-surface border border-white/15 text-white"
                    >
                      <span>{formatFriendlyDate(dateStr)}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomDate(dateStr)}
                        className="text-outline hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove date"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MULTI TASK PROJECT: START & END DATE WITH QUICK CHOOSE PRESETS
  if (engine === "MULTI_TASK") {
    const startDate = config.startDate || today;
    const endDate = config.endDate || addDaysToString(startDate, 7);
    const durationPreset = config.durationPreset || "1 Week";

    // Calculate duration in days
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

    const handleApplyPreset = (presetLabel: string, days: number) => {
      const computedEnd = addDaysToString(startDate, days);
      onChange({
        ...config,
        engine: "MULTI_TASK",
        frequency: "multi_task",
        startDate,
        endDate: computedEnd,
        durationPreset: presetLabel,
      });
    };

    const handleStartDateChange = (newStart: string) => {
      let newEnd = endDate;
      if (newEnd < newStart) {
        newEnd = addDaysToString(newStart, diffDays || 7);
      }
      onChange({
        ...config,
        engine: "MULTI_TASK",
        frequency: "multi_task",
        startDate: newStart,
        endDate: newEnd,
      });
    };

    const handleEndDateChange = (newEnd: string) => {
      onChange({
        ...config,
        engine: "MULTI_TASK",
        frequency: "multi_task",
        startDate,
        endDate: newEnd,
        durationPreset: "Custom",
      });
    };

    return (
      <div
        className={cn(
          "p-3.5 rounded-xl border bg-obsidian-deep/80 space-y-3 animate-in fade-in-20 duration-150",
          className
        )}
        style={{ borderColor: `${accentColor}35` }}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
            <Layers size={13} style={{ color: accentColor }} />
            <span>Project Milestones Timeframe</span>
          </label>

          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded font-semibold border"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}35`,
              color: accentColor,
            }}
          >
            {diffDays} Day{diffDays === 1 ? "" : "s"} Sprint
          </span>
        </div>

        {/* Quick Duration Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-mono text-outline mr-1">Quick duration:</span>
          {MULTI_TASK_PRESETS.map((preset) => {
            const isSelected = durationPreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.label, preset.days)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer",
                  isSelected
                    ? "text-white font-semibold shadow-sm"
                    : "bg-surface-container-lowest/60 border-white/10 text-outline hover:text-white hover:border-white/25"
                )}
                style={{
                  backgroundColor: isSelected ? `${accentColor}25` : undefined,
                  borderColor: isSelected ? accentColor : undefined,
                  color: isSelected ? accentColor : undefined,
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Start Date & End Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <div>
            <label className="text-[10px] font-mono uppercase text-outline block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                if (e.target.value) handleStartDateChange(e.target.value);
              }}
              className="w-full bg-charcoal-surface border border-white/15 focus:border-white/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-outline block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                if (e.target.value) handleEndDateChange(e.target.value);
              }}
              className="w-full bg-charcoal-surface border border-white/15 focus:border-white/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Timeline Summary Badge */}
        <div className="text-[11px] font-mono text-outline flex items-center justify-between pt-1 border-t border-white/5">
          <span>
            {formatFriendlyDate(startDate)} → {formatFriendlyDate(endDate)}
          </span>
          <span className="text-white font-semibold">
            {diffDays} calendar days
          </span>
        </div>
      </div>
    );
  }

  // 4. DAILY ROUTINE: INFORMATIVE BANNER
  return (
    <div
      className={cn(
        "p-3 rounded-xl border bg-obsidian-deep/60 flex items-center gap-2.5 text-xs font-mono text-outline",
        className
      )}
      style={{ borderColor: `${accentColor}20` }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
      >
        <RotateCcw size={13} />
      </div>
      <div>
        <span className="text-white font-semibold">Daily Habit: </span>
        <span>Recurs every single day. Streak continuity multiplies pet evolution XP.</span>
      </div>
    </div>
  );
}
