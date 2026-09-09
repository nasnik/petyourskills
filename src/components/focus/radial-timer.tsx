"use client";

import React from "react";
import { formatDuration } from "@/lib/utils";

interface RadialTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  accentColor?: string;
}

export function RadialTimer({
  totalSeconds,
  remainingSeconds,
  accentColor = "#3B82F6",
}: RadialTimerProps) {
  const radius = 130;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Background track */}
        <circle
          stroke="#1c1b1b"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Glowing animated progress ring */}
        <circle
          stroke={accentColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-in-out",
            filter: `drop-shadow(0 0 12px ${accentColor})`,
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>

      {/* Center Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          {formatDuration(remainingSeconds)}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-outline mt-2">
          Remaining
        </span>
      </div>
    </div>
  );
}
