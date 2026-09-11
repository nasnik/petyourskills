"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Check, Shield, Link2, KeyRound } from "lucide-react";
import { computeProjectPassCode } from "@/lib/collaboration";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle?: string;
  passCode?: string;
  projectId?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  projectTitle = "Group Project",
  passCode: propPassCode,
  projectId,
}: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Clean, memorable passcode for the project (e.g. CYS-8941, WORK-8941, etc.)
  // Deterministic — the join server action verifies against the same helper.
  const passCode = propPassCode || computeProjectPassCode(projectTitle);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://petyourskills.agency.dev";
  const inviteUrl = `${origin}/join?code=${passCode}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-deep/80 backdrop-blur-md animate-in fade-in-20 duration-200">
      <div className="w-full max-w-md bg-charcoal-surface border border-white/10 rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-wellness-emerald mb-1">
          <Shield size={18} />
          <h3 className="font-bold text-white text-base">
            Share &ldquo;{projectTitle}&rdquo;
          </h3>
        </div>
        <p className="text-xs text-outline font-mono mb-5">
          Invite teammates with zero-knowledge, project-scoped passkey access.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-outline mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} />
              Project Passkey
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={passCode}
                className="font-mono text-center tracking-widest text-base font-bold bg-obsidian-deep text-wellness-emerald"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyCode}
                className="shrink-0 cursor-pointer"
              >
                {copiedCode ? <Check size={16} className="text-wellness-emerald" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-outline mb-1.5 flex items-center gap-1.5">
              <Link2 size={13} />
              Direct Invite Link
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
                className="shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check size={16} className="text-wellness-emerald" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-obsidian-deep/90 border border-white/5 text-[11px] font-mono text-outline leading-relaxed space-y-1.5">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Shield size={12} className="text-wellness-emerald" />
              <span>Privacy & Scoped Access</span>
            </div>
            <p>
              Invited users join as <span className="text-white">Anonymous Collaborators</span> and will <span className="text-white">only</span> see this project in their sidebar. None of your personal life domains, habits, or companion pets are visible to them.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose} className="cursor-pointer">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
