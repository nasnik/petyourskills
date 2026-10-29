"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Zap,
  ChevronRight,
  Users,
  PersonStanding,
} from "lucide-react";
import { useApp } from "@/lib/store/app-context";
import { BoardMessageItem, SquadPresence } from "@/types";
import { cn } from "@/lib/utils";

interface SquadChannelProps {
  projectId: string;
  domainColor: string;
}

const MESSAGE_POLL_MS = 3000;
const PRESENCE_POLL_MS = 5000;

/** Renders a member's avatar bubble (monogram or emoji). */
function PresenceBubble({ presence, color }: { presence: SquadPresence; color: string }) {
  return (
    <div
      className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm border"
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}50`,
      }}
      title={`${presence.name}${presence.isFocusing ? " · focusing" : ""}`}
    >
      <span className="leading-none select-none">{presence.avatar}</span>
      <span
        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-obsidian-deep"
        style={{
          backgroundColor: presence.isFocusing ? "#10B981" : "#22C55E",
          boxShadow: presence.isFocusing ? `0 0 6px ${color}` : "none",
        }}
      />
    </div>
  );
}

export function SquadChannel({ projectId, domainColor }: SquadChannelProps) {
  const { user, isFocusModalOpen } = useApp();
  const [messages, setMessages] = useState<BoardMessageItem[]>([]);
  const [presence, setPresence] = useState<SquadPresence[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const onlineCount = presence.length;
  const focusingCount = presence.filter((p) => p.isFocusing).length;
  const sharedFocusActive = focusingCount >= 2;

  // Auto-scroll to the newest message when new ones arrive.
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const loadMessages = useCallback(async () => {
    try {
      const { getBoardMessagesAction } = await import("@/actions/chat");
      const res = await getBoardMessagesAction(projectId);
      if (res.success) setMessages(res.messages);
    } catch {
      // non-critical — ignore transient fetch failures
    }
  }, [projectId]);

  const syncPresence = useCallback(async () => {
    try {
      const { syncPresenceAction } = await import("@/actions/chat");
      const res = await syncPresenceAction(projectId, isFocusModalOpen);
      if (res.success) setPresence(res.presence);
    } catch {
      // non-critical — ignore transient fetch failures
    }
  }, [projectId, isFocusModalOpen]);

  // Initial load + polling for messages and presence.
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      await Promise.all([loadMessages(), syncPresence()]);
    };
    tick();
    const msgInt = setInterval(loadMessages, MESSAGE_POLL_MS);
    const presInt = setInterval(syncPresence, PRESENCE_POLL_MS);
    return () => {
      mounted = false;
      clearInterval(msgInt);
      clearInterval(presInt);
    };
  }, [loadMessages, syncPresence]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    // Optimistic append (temporary id, replaced on next poll).
    const optimistic: BoardMessageItem = {
      id: `tmp-${Date.now()}`,
      boardId: projectId,
      userId: user.id,
      userName: user.callSign,
      userAvatar: user.avatar,
      content,
      type: "TEXT",
      companionBadge: undefined,
      xpRewardYield: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const { sendBoardMessageAction } = await import("@/actions/chat");
      const res = await sendBoardMessageAction(projectId, content);
      if (!res.success) {
        // Roll back the optimistic message on failure.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id && res.message ? res.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-charcoal-surface/50 flex flex-col overflow-hidden transition-all duration-300",
        collapsed ? "w-12" : "w-[340px] xl:w-[360px]"
      )}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand Squad Channel"
            className="w-full flex items-center justify-center text-outline hover:text-white cursor-pointer"
          >
            <MessageSquare size={16} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={15} style={{ color: domainColor }} />
              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold text-white truncate">
                  Squad Channel
                </p>
                <p className="text-[9px] font-mono text-outline flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-wellness-emerald animate-pulse" />
                  {onlineCount} Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {sharedFocusActive && (
                <span
                  className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                  style={{ backgroundColor: `${domainColor}25`, color: domainColor }}
                  title={`Shared Focus: ${focusingCount} members focusing`}
                >
                  <Zap size={9} /> +20% XP
                </span>
              )}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Collapse"
                className="text-outline hover:text-white cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Presence strip */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center -space-x-2">
              {presence.length === 0 && (
                <span className="text-[9px] font-mono text-outline">No members online</span>
              )}
              {presence.slice(0, 5).map((p) => (
                <PresenceBubble key={p.userId} presence={p} color={domainColor} />
              ))}
              {presence.length > 5 && (
                <span className="text-[9px] font-mono text-outline px-1">
                  +{presence.length - 5}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-outline flex items-center gap-1">
              <Users size={10} />
              {focusingCount} focusing
            </span>
          </div>

          {/* Message feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[220px]">
            {messages.length === 0 && (
              <p className="text-[10px] font-mono text-outline text-center py-6">
                No messages yet. Start the conversation.
              </p>
            )}
            {messages.map((m) =>
              m.type === "SYSTEM_QUEST_LOG" ? (
                <SystemQuestLog key={m.id} message={m} color={domainColor} />
              ) : (
                <UserMessage key={m.id} message={m} color={domainColor} />
              )
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-white/10 shrink-0 space-y-1.5">
            <div className="flex items-end gap-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message squad or @companion..."
                maxLength={500}
                className="flex-1 h-9 px-3 rounded-lg bg-obsidian-deep border border-white/15 focus:border-wellness-emerald/60 outline-none text-xs text-white placeholder:text-white/25 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-obsidian-deep font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: domainColor }}
                title="Send"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-outline">
              <span className="flex items-center gap-0.5">
                <PersonStanding size={9} /> Companion boosts active
              </span>
              <span>·</span>
              <span>Markdown supported</span>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function UserMessage({ message, color }: { message: BoardMessageItem; color: string }) {
  const time = new Date(message.createdAt);
  const timeLabel = isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="flex gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0"
        style={{ backgroundColor: `${color}20`, borderColor: `${color}50` }}
      >
        <span className="leading-none select-none">{message.userAvatar || "🐾"}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-white">
            {message.userName || "Collaborator"}
          </span>
          {message.companionBadge && (
            <span
              className="text-[8px] font-mono font-bold px-1 py-px rounded"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {message.companionBadge}
            </span>
          )}
          {timeLabel && <span className="text-[9px] font-mono text-outline">{timeLabel}</span>}
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5 break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function SystemQuestLog({ message, color }: { message: BoardMessageItem; color: string }) {
  const time = new Date(message.createdAt);
  const timeLabel = isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div
      className="rounded-lg border px-2.5 py-2 flex items-start gap-2"
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}35`,
      }}
    >
      <span className="text-sm leading-none mt-0.5">★</span>
      <div className="min-w-0">
        <p className="text-[10px] font-mono leading-relaxed" style={{ color }}>
          <span className="font-bold">{message.userName || "A member"}</span> finished{" "}
          <span className="font-bold">{message.content}</span>
          {message.xpRewardYield ? (
            <span className="ml-1 font-bold">(+{message.xpRewardYield} XP)</span>
          ) : null}
        </p>
        {timeLabel && <p className="text-[9px] font-mono text-outline mt-0.5">{timeLabel}</p>}
      </div>
    </div>
  );
}
