"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ActiveCompanionCard } from "@/components/dashboard/active-companion-card";
import { DailyXpGauge } from "@/components/dashboard/daily-xp-gauge";
import { PetHappinessCard } from "@/components/dashboard/pet-happiness-card";
import { QuestList } from "@/components/dashboard/quest-list";
import { DailyYieldBanner } from "@/components/dashboard/daily-yield-banner";
import { DailyCompletionSummary } from "@/components/dashboard/daily-completion-summary";
import { ProjectKanbanBoard } from "@/components/kanban/project-kanban-board";
import { useApp } from "@/lib/store/app-context";
import { Zap, Plus, Users, FolderKanban, ArrowRight, UserPlus } from "lucide-react";

export default function DashboardPage() {
  const { user, domains, openCreateTaskModal, activeProjectId, setActiveProjectId } = useApp();
  const isGuest = !!user.isAnonymous;

  // Auto-open the shared project workspace once right after a passkey join.
  // A sessionStorage flag keeps "Back to Dashboard" usable afterwards.
  useEffect(() => {
    if (!isGuest || !user.sharedProjectId || activeProjectId) return;
    try {
      const flag = "pys_guest_autoopen_done";
      if (!sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, "1");
        setActiveProjectId(user.sharedProjectId);
      }
    } catch {
      setActiveProjectId(user.sharedProjectId);
    }
  }, [isGuest, user.sharedProjectId, activeProjectId, setActiveProjectId]);

  const handleQuickLogAction = () => {
    openCreateTaskModal();
  };

  // If a multi-task project is selected, render its ready-to-use 4-column Kanban workspace!
  if (activeProjectId) {
    return <ProjectKanbanBoard projectId={activeProjectId} />;
  }

  // Guest home — scoped view with just the shared project (no personal widgets)
  if (isGuest) {
    const sharedDomain = domains[0];
    return (
      <div className="space-y-8 relative animate-in fade-in-20 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-hanken">
              Shared Workspace
            </h1>
            <p className="text-xs font-mono text-outline mt-1">
              Guest collaborator session — scoped to one project
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-white/10 text-xs font-mono">
            <span className="text-outline uppercase tracking-wider text-[11px]">
              ACCESS:
            </span>
            <span className="text-white font-bold flex items-center gap-1">
              <Users size={13} className="text-wellness-emerald" />
              Guest
            </span>
          </div>
        </div>

        {/* Shared Project Card */}
        <div className="bg-charcoal-surface border border-white/10 rounded-xl p-6 shadow-lg relative overflow-hidden max-w-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-wellness-emerald" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-wellness-emerald/15 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <FolderKanban size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-wellness-emerald font-bold mb-1">
                Shared Project • Multi-Task Board
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight truncate">
                {sharedDomain?.name ?? "Shared Project"}
              </h2>
              <p className="text-xs text-outline mt-1 font-mono">
                You can view and edit cards on this board. The host&apos;s
                personal domains remain private.
              </p>

              <button
                type="button"
                onClick={() =>
                  user.sharedProjectId &&
                  setActiveProjectId(user.sharedProjectId)
                }
                className="mt-4 h-10 px-5 rounded-lg bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] cursor-pointer"
              >
                <span>Open Project Board</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Upgrade CTA Card */}
        <div className="bg-charcoal-surface/60 border border-white/5 rounded-xl p-5 max-w-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Want to track your own skills?
            </h3>
            <p className="text-xs text-outline mt-1">
              Create a free account to add personal skills, customize companion
              pets, and keep access to this shared project.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="h-10 px-4 rounded-lg border border-wellness-emerald/40 bg-wellness-emerald/10 text-wellness-emerald font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-wellness-emerald/20 transition-all shrink-0"
          >
            <UserPlus size={14} />
            <span>Sign Up Free</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative animate-in fade-in-20 duration-200">
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
          <span className="text-white font-bold flex items-center gap-1.5">
            <Zap size={13} className="text-[#F59E0B] fill-[#F59E0B]" />
            <span>{user.rankTitle} Tier {user.rankTier}</span>
          </span>
        </div>
      </div>

      {/* Top 3 Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ActiveCompanionCard />
        <DailyXpGauge />
        <PetHappinessCard />
      </div>

      {/* Daily Completion Summary */}
      <DailyCompletionSummary />

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
