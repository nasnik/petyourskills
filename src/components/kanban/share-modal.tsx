"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Check, Shield, Link2, KeyRound } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = "https://petyourskills.agency.dev/join?token=sec_9941_aegis";
  const passCode = "VANGUARD-8941";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(passCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-deep/80 backdrop-blur-md animate-in fade-in-20 duration-200">
      <div className="w-full max-w-md bg-charcoal-surface border border-white/10 rounded p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-work-electric-blue mb-1">
          <Shield size={18} />
          <h3 className="font-bold text-white text-base">
            Collaborative Board Access
          </h3>
        </div>
        <p className="text-xs text-outline font-mono mb-5">
          Invite teammates with end-to-end Row-Level Security permissions.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-outline mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} />
              Board Passcode
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={passCode}
                className="font-mono text-center tracking-widest text-base font-bold bg-obsidian-deep"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {copiedCode ? <Check size={16} className="text-wellness-emerald" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-outline mb-1.5 flex items-center gap-1.5">
              <Link2 size={13} />
              Single-Use Invite Link (TTL: 24h)
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteUrl}
                className="font-mono text-xs text-outline bg-obsidian-deep truncate"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copiedLink ? <Check size={16} className="text-wellness-emerald" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded bg-obsidian-deep border border-white/5 text-[11px] font-mono text-outline leading-relaxed">
            Collaborators joining via this link will automatically sync with Supabase Realtime under the <span className="text-white">Editor</span> role.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
