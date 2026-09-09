"use client";

import React from "react";
import { ActiveCompanionCard } from "@/components/dashboard/active-companion-card";
import { DailyXpGauge } from "@/components/dashboard/daily-xp-gauge";
import { PetHappinessCard } from "@/components/dashboard/pet-happiness-card";
import { QuestList } from "@/components/dashboard/quest-list";
import { DailyYieldBanner } from "@/components/dashboard/daily-yield-banner";
import { useApp } from "@/lib/store/app-context";
import { Zap, Plus } from "lucide-react";

export default function DashboardPage() {
  const { addTask, domains } = useApp();

  const handleQuickLogAction = () => {
    const title = prompt("Enter quick task or habit to log:");
    if (!title?.trim()) return;
    const healthDomain = domains.find((d) => d.slug === "health") || domains[0];
    addTask(healthDomain.id, title.trim(), 20, 25);
  };

  return (
    <div className="space-y-8 relative">
      {/* Page Title & Rank Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-hanken">
            Dashboard
          </h1>
          <p className="text-xs font-mono text-outline mt-1">
            Monday, September 7, 2026
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-white/10 text-xs font-mono">
          <span className="text-outline uppercase tracking-wider text-[11px]">
            CURRENT RANK:
          </span>
          <span className="text-white font-bold flex items-center gap-1">
            <Zap size={13} className="text-[#F59E0B] fill-[#F59E0B]" />
            Vanguard III
          </span>
        </div>
      </div>

      {/* Top 3 Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ActiveCompanionCard />
        <DailyXpGauge />
        <PetHappinessCard />
      </div>

      {/* Today's Quests Filterable Section */}
      <div className="pt-2">
        <QuestList />
      </div>

      {/* Daily Cycle Yield Banner */}
      <DailyYieldBanner />

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button
          onClick={handleQuickLogAction}
          className="h-12 px-5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold text-sm shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          <span>Quick Log Action</span>
        </button>
      </div>
    </div>
  );
}
