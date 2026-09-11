import React from "react";
import { AppProvider } from "@/lib/store/app-context";
import { Sidebar } from "@/components/layout/sidebar";
import { FocusTimerModal } from "@/components/focus/focus-timer-modal";
import { TaskInspectorDrawer } from "@/components/inspector/task-inspector-drawer";
import { CreateTaskModal } from "@/components/dashboard/create-task-modal";
import { UpgradeAccountModal } from "@/components/layout/upgrade-account-modal";
import { UserHeaderPill } from "@/components/layout/user-header-pill";
import { fetchDashboardSeedData } from "@/lib/dashboard-seed";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, domains, tasks } = await fetchDashboardSeedData();

  return (
    <AppProvider initialUser={user} initialDomains={domains} initialTasks={tasks}>
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

            {/* User Profile Pill — reads real user from context */}
            <UserHeaderPill />
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

        {/* Global Create Task / Skill Modal */}
        <CreateTaskModal />

        {/* Guest Upgrade Explainer Modal */}
        <UpgradeAccountModal />
      </div>
    </AppProvider>
  );
}
