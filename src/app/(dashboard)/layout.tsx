"use client";

import React from "react";
import { AppProvider } from "@/lib/store/app-context";
import { Sidebar } from "@/components/layout/sidebar";
import { FocusTimerModal } from "@/components/focus/focus-timer-modal";
import { TaskInspectorDrawer } from "@/components/inspector/task-inspector-drawer";
import { Sparkles, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-obsidian-deep text-on-surface">
        {/* Persistent Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Global Utility Bar */}
          <header className="h-16 px-8 border-b border-white/10 flex items-center justify-between shrink-0 bg-charcoal-surface/60 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-mono text-outline">
              <span className="w-2 h-2 rounded-full bg-wellness-emerald animate-pulse" />
              <span>TLS 1.3 Encrypted Session</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-7 h-7 rounded-full bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-xs font-bold text-wellness-emerald">
                AN
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">
                    Anastasia Nikulina
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-wellness-emerald/20 text-wellness-emerald font-semibold">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] font-mono text-outline leading-tight">
                  commander@agency.dev
                </span>
              </div>
            </div>
          </header>

          {/* Page View Canvas */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
              {children}
            </div>
          </main>
        </div>

        {/* Global Deep Focus Overlay */}
        <FocusTimerModal />

        {/* Global Task Inspector Drawer */}
        <TaskInspectorDrawer />
      </div>
    </AppProvider>
  );
}
