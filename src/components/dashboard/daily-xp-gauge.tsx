"use client";

import React from "react";
import { Zap } from "lucide-react";

export function DailyXpGauge() {
  const percentage = 75;
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-4 flex items-center justify-between relative overflow-hidden">
      {/* Left Circular Gauge */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#1c1b1b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#00E5FF"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute font-mono text-xs font-bold text-white">
          {percentage}%
        </span>
      </div>

      {/* Right Stats */}
      <div className="flex-1 pl-4 flex flex-col justify-center">
        <span className="font-mono text-[11px] uppercase tracking-wider text-outline mb-0.5">
          Daily XP Goal
        </span>
        <div className="text-lg font-bold text-white font-mono">
          750 <span className="text-outline text-xs font-normal">/ 1,000 XP</span>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00E5FF] mt-1 bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/30 w-fit">
          <Zap size={10} />
          <span>+150 XP from Deep Focus</span>
        </div>
      </div>
    </div>
  );
}
