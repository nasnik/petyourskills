"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, Sliders, CreditCard, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, domains } = useApp();
  const [tab, setTab] = useState<"profile" | "preferences" | "billing">("profile");

  const [callSign, setCallSign] = useState(user.callSign);
  const [email, setEmail] = useState(user.email);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-hanken">
          Settings & Identity
        </h1>
        <p className="text-xs font-mono text-outline mt-1">
          Manage your operative credentials, domain configurations, and discipline protocols.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded text-xs font-mono transition-colors cursor-pointer",
            tab === "profile"
              ? "bg-white/10 text-white font-semibold"
              : "text-outline hover:text-white"
          )}
        >
          <User size={14} />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setTab("preferences")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded text-xs font-mono transition-colors cursor-pointer",
            tab === "preferences"
              ? "bg-white/10 text-white font-semibold"
              : "text-outline hover:text-white"
          )}
        >
          <Sliders size={14} />
          <span>Life Domains</span>
        </button>

        <button
          onClick={() => setTab("billing")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded text-xs font-mono transition-colors cursor-pointer",
            tab === "billing"
              ? "bg-white/10 text-white font-semibold"
              : "text-outline hover:text-white"
          )}
        >
          <CreditCard size={14} />
          <span>Billing</span>
        </button>
      </div>

      {/* Tab Contents */}
      {tab === "profile" && (
        <form onSubmit={handleSave} className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
            <Shield size={16} className="text-wellness-emerald" />
            <span>Operative Profile</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                Operative Call Sign / Full Name
              </label>
              <Input
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                System Secure Email
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                Change Cipher Key (Password)
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedMessage ? (
              <span className="text-xs font-mono text-wellness-emerald">
                ✓ Identity settings updated securely.
              </span>
            ) : <span />}

            <Button type="submit" variant="primary" size="md" className="gap-2 bg-white text-obsidian-deep font-semibold">
              <Save size={15} />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      )}

      {tab === "preferences" && (
        <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white font-mono">
            Configured Life Domains
          </h3>
          <p className="text-xs text-outline font-mono">
            Toggle which life domains are tracked in your persistent sidebar and dashboard.
          </p>

          <div className="space-y-3 pt-2">
            {domains.map((dom) => (
              <div
                key={dom.id}
                className="p-3.5 rounded border border-white/5 bg-obsidian-deep flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${dom.accentColor}20`,
                      color: dom.accentColor,
                    }}
                  >
                    {dom.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {dom.name}
                    </div>
                    <div className="text-[10px] font-mono text-outline">
                      {dom.avatarSpecies} · Level {dom.level}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono text-wellness-emerald px-2 py-0.5 rounded bg-wellness-emerald/15">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="bg-charcoal-surface border border-white/10 rounded p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-outline mx-auto">
            <CreditCard size={20} />
          </div>
          <h3 className="text-sm font-bold text-white font-mono">
            Pet Your Skills V1 (Free Tier Active)
          </h3>
          <p className="text-xs text-outline font-mono max-w-sm mx-auto">
            All gamification companions, realtime boards, and analytics are free in v1. Paid enterprise tiers will be introduced in MVP 2.
          </p>
        </div>
      )}
    </div>
  );
}
