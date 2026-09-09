"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function DailyYieldBanner() {
  return (
    <div className="rounded border border-wellness-emerald/30 bg-wellness-emerald/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">
            Daily Cycle Yield:{" "}
            <span className="text-wellness-emerald font-mono font-bold">
              +1,400 XP / cycle
            </span>
          </div>
          <p className="text-xs text-outline font-mono mt-0.5">
            Empowered by physical conditioning, sleep consistency, and hydration habits.
          </p>
        </div>
      </div>

      <Link
        href="/growth"
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-white bg-charcoal-surface hover:bg-white/10 border border-white/15 rounded transition-colors shrink-0"
      >
        <span>View Active Companions</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
