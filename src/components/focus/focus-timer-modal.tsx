"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/lib/store/app-context";
import { RadialTimer } from "./radial-timer";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, RotateCcw, Award } from "lucide-react";
import confetti from "canvas-confetti";

export function FocusTimerModal() {
  const {
    isFocusModalOpen,
    closeFocusModal,
    focusTargetTask,
    tasks,
    recordCompletedFocus,
    domains,
    setFocusTargetTask,
  } = useApp();

  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60); // 25 min
  const [remaining, setRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const prevOpenRef = useRef<boolean>(false);
  const currentTaskIdRef = useRef<string | null>(null);

  // Initialize or reset timer ONLY when modal opens or target task changes.
  // Must NOT re-run on background tasks polling (which updates tasks array every 3s).
  useEffect(() => {
    if (
      isFocusModalOpen &&
      (!prevOpenRef.current || (focusTargetTask && focusTargetTask.id !== currentTaskIdRef.current))
    ) {
      const targetId = focusTargetTask?.id || (tasks.length > 0 ? tasks[0].id : "");
      setSelectedTaskId(targetId);
      currentTaskIdRef.current = focusTargetTask?.id ?? null;

      const dur = focusTargetTask?.estimatedMinutes
        ? focusTargetTask.estimatedMinutes * 60
        : 25 * 60;
      setSelectedDuration(dur);
      setRemaining(dur);
      setIsRunning(false);
      setStartedAt(null);
      setSessionCompleted(false);
      setEarnedXp(0);
      endTimeRef.current = null;
    }

    prevOpenRef.current = isFocusModalOpen;
  }, [isFocusModalOpen, focusTargetTask?.id]);

  const clearModalState = () => {
    endTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setFocusTargetTask(null);
    closeFocusModal();
    setIsRunning(false);
    setStartedAt(null);
    setSessionCompleted(false);
    setEarnedXp(0);
    currentTaskIdRef.current = null;
    prevOpenRef.current = false;
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const activeDomain = domains.find((d) => d.id === activeTask?.domainId) || domains[0];
  const displayTask = focusTargetTask || activeTask;
  const displayDomain = domains.find((d) => d.id === displayTask?.domainId) || domains[0];

  const handleStart = () => {
    if (remaining <= 0) {
      setRemaining(selectedDuration);
      endTimeRef.current = Date.now() + selectedDuration * 1000;
    } else {
      endTimeRef.current = Date.now() + remaining * 1000;
    }
    if (!startedAt) {
      setStartedAt(new Date());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    if (endTimeRef.current) {
      const leftSec = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(leftSec);
      endTimeRef.current = null;
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    endTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setRemaining(selectedDuration);
    setStartedAt(null);
    setSessionCompleted(false);
  };

  const handleSelectPreset = (minutes: number) => {
    if (isRunning) return;
    endTimeRef.current = null;
    const dur = minutes * 60;
    setSelectedDuration(dur);
    setRemaining(dur);
    setStartedAt(null);
  };

  const handleSessionFinish = useCallback(() => {
    endTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setRemaining(0);
    const xp = Math.max(50, Math.floor((selectedDuration / 60) * 5));
    setEarnedXp(xp);
    setSessionCompleted(true);

    recordCompletedFocus(selectedDuration, xp, displayTask);

    // Fire glowing confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10B981", "#3B82F6", "#8B5CF6", "#ffffff"],
    });
  }, [selectedDuration, displayTask, recordCompletedFocus]);

  const finishRef = useRef(handleSessionFinish);
  finishRef.current = handleSessionFinish;

  const updateTimer = useCallback(() => {
    if (!endTimeRef.current) return;
    const now = Date.now();
    const leftMs = endTimeRef.current - now;
    const leftSec = Math.max(0, Math.ceil(leftMs / 1000));

    if (leftSec <= 0) {
      setRemaining(0);
      endTimeRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      finishRef.current();
    } else {
      setRemaining(leftSec);
    }
  }, []);

  // Timer Tick with wall-clock sync & visibilitychange listener
  useEffect(() => {
    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + remaining * 1000;
      }

      updateTimer();

      timerRef.current = setInterval(() => {
        updateTimer();
      }, 500);

      const handleSync = () => {
        updateTimer();
      };

      document.addEventListener("visibilitychange", handleSync);
      window.addEventListener("focus", handleSync);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        document.removeEventListener("visibilitychange", handleSync);
        window.removeEventListener("focus", handleSync);
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, updateTimer]);

  if (!isFocusModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-deep/95 backdrop-blur-2xl animate-in fade-in-20 duration-200">
      {/* Top Bar with Close Button */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={clearModalState}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-outline hover:text-white hover:border-white/30 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Focus Capsule */}
      <div className="w-full max-w-xl px-6 flex flex-col items-center text-center">
{/* Domain Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium mb-4 uppercase tracking-widest border"
            style={{
              color: displayDomain?.accentColor || "#3B82F6",
              borderColor: `${displayDomain?.accentColor || "#3B82F6"}40`,
              backgroundColor: `${displayDomain?.accentColor || "#3B82F6"}15`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: displayDomain?.accentColor || "#3B82F6" }}
            />
            <span>{displayDomain?.name || "Deep Work"} Domain</span>
          </div>

          {/* Task Title */}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 font-hanken max-w-lg">
            {displayTask ? displayTask.title : "Deep Focus Sprint"}
          </h2>
        <p className="text-xs font-mono text-outline uppercase tracking-wider mb-8">
          Do not disturb. Feeding the system.
        </p>

        {/* Radial Countdown Timer */}
        <div className="my-2">
          <RadialTimer
            totalSeconds={selectedDuration}
            remainingSeconds={remaining}
            accentColor={activeDomain?.accentColor || "#3B82F6"}
          />
        </div>

        {/* Presets when paused */}
        {!isRunning && !sessionCompleted && (
          <div className="flex items-center gap-2 mt-6">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectPreset(mins)}
                className={`px-3 py-1 text-xs font-mono rounded border transition-all cursor-pointer ${
                  selectedDuration === mins * 60
                    ? "bg-white text-obsidian-deep font-semibold border-white"
                    : "bg-surface-container-low text-outline border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-8">
          {sessionCompleted ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-wellness-emerald font-mono text-sm font-semibold">
                <Award size={18} />
                <span>Focus Completed! +{earnedXp} XP Verified</span>
              </div>
              <Button onClick={clearModalState} variant="primary" size="lg">
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <>
              {isRunning ? (
                <Button
                  onClick={handlePause}
                  variant="secondary"
                  size="lg"
                  className="w-36 gap-2"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  variant="primary"
                  size="lg"
                  className="w-36 gap-2 bg-white text-obsidian-deep font-semibold"
                >
                  <Play size={16} className="fill-obsidian-deep" />
                  <span>Start Focus</span>
                </Button>
              )}

              <Button
                onClick={handleReset}
                variant="ghost"
                size="lg"
                className="text-outline hover:text-white"
              >
                <RotateCcw size={16} />
              </Button>

              <button
                onClick={handleSessionFinish}
                className="text-xs font-mono text-outline hover:text-wellness-emerald underline underline-offset-4 transition-colors cursor-pointer ml-2"
              >
                Test Instant Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
