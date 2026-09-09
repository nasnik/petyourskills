"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store/app-context";
import { UserRankBadge } from "./user-rank-badge";
import { DomainAccordion } from "./domain-accordion";
import {
  Sparkles,
  LayoutDashboard,
  KanbanSquare,
  TrendingUp,
  Play,
  Settings,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { domains, tasks, openFocusModal } = useApp();
  const [openDomainId, setOpenDomainId] = useState<string | null>("dom-health");

  const todayStr = "Monday, September 7, 2026";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kanban", label: "Kanban Board", icon: KanbanSquare },
    { href: "/growth", label: "Growth Analytics", icon: TrendingUp },
  ];

  return (
    <aside className="w-80 h-screen sticky top-0 flex flex-col bg-charcoal-surface/95 border-r border-white/10 shrink-0 select-none overflow-hidden z-20">
      {/* Top Header */}
      <div className="p-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Pet Your Skills
            </span>
          </Link>
          <span className="text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            v2.4.0
          </span>
        </div>
        <div className="text-xs text-outline font-mono pl-9">{todayStr}</div>
      </div>

      {/* Rank Status Card */}
      <div className="p-4 pb-2">
        <UserRankBadge />
      </div>

      {/* Navigation Routes */}
      <div className="px-4 py-2 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all",
                isActive
                  ? "bg-white/10 text-white font-semibold border border-white/15"
                  : "text-on-surface-variant hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                size={16}
                className={isActive ? "text-wellness-emerald" : "text-outline"}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Life Domains & Companions Section */}
      <div className="flex-1 px-4 py-2 overflow-y-auto space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-outline px-1 mb-1">
          <span>Life Domains & Companions</span>
          <ShieldCheck size={14} className="text-outline" />
        </div>

        {domains.map((domain) => {
          const domainTasks = tasks.filter((t) => t.domainId === domain.id);
          return (
            <DomainAccordion
              key={domain.id}
              domain={domain}
              tasks={domainTasks}
              isOpen={openDomainId === domain.id}
              onToggle={() =>
                setOpenDomainId((prev) => (prev === domain.id ? null : domain.id))
              }
            />
          );
        })}
      </div>

      {/* Bottom Focus Launcher & Actions */}
      <div className="p-4 pt-2 border-t border-white/10 bg-surface-container-lowest/80 space-y-3">
        <button
          type="button"
          onClick={() => openFocusModal()}
          className="w-full h-11 bg-white hover:bg-white/90 text-obsidian-deep font-semibold text-sm rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] cursor-pointer"
        >
          <Play size={16} className="fill-obsidian-deep" />
          <span>Start Focus Session</span>
        </button>

        <div className="flex items-center justify-between text-xs text-outline font-mono pt-1">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={() => alert("Support & Guild telemetrics: online.")}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
