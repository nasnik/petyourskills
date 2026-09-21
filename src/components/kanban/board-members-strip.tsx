"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/store/app-context";
import { ProjectMember } from "@/types";
import { getDomainAvatarEmoji } from "@/lib/avatar-utils";
import { Crown } from "lucide-react";

interface BoardMembersStripProps {
  projectId: string;
  domainColor: string;
  /** Host avatar species (e.g. "Wisdom Owl") — used when the host has no stored emoji */
  hostAvatarSpecies?: string;
}

export function BoardMembersStrip({
  projectId,
  domainColor,
  hostAvatarSpecies,
}: BoardMembersStripProps) {
  const { user } = useApp();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchMembers = async () => {
    try {
      const { getProjectMembersAction } = await import("@/actions/collaboration");
      const res = await getProjectMembersAction(projectId);
      if (!mountedRef.current) return;
      if (res.success && res.members && res.members.length > 0) {
        setMembers(res.members);
      } else if (res.success && (!res.members || res.members.length === 0)) {
        // Build a local-only list from current user context as fallback
        const localMember: ProjectMember = {
          id: user.id,
          name: user.callSign || "Collaborator",
          avatar: user.avatar || (user.isAnonymous ? "?" : getDomainAvatarEmoji(hostAvatarSpecies)),
          isHost: !user.isAnonymous,
          activityCount: 0,
          joinedAt: new Date().toISOString(),
        };
        setMembers([localMember]);
      }
    } catch {
      // Silently fail — strip is non-critical
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchMembers();
    // Poll every 15 s so new members appear without a page refresh
    pollRef.current = setInterval(fetchMembers, 15000);
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Ensure the current guest always appears, with their actual selected avatar,
  // and the host always shows the domain companion (same as left of the project name).
  const enrichedMembers = members.map((m) => {
    if (m.id === user.id && user.avatar && !m.isHost) {
      return { ...m, avatar: user.avatar, name: user.callSign || m.name };
    }
    if (m.isHost && hostAvatarSpecies) {
      return { ...m, avatar: getDomainAvatarEmoji(hostAvatarSpecies) };
    }
    return m;
  });

  // If current user is not in the list yet, prepend them optimistically
  const currentUserInList = enrichedMembers.some((m) => m.id === user.id);
  const displayMembers: ProjectMember[] = currentUserInList
    ? enrichedMembers
    : [
        {
          id: user.id,
          name: user.callSign || "Collaborator",
          avatar: user.avatar || "?",
          isHost: !user.isAnonymous,
          activityCount: 0,
          joinedAt: new Date().toISOString(),
        },
        ...enrichedMembers,
      ];

  if (displayMembers.length === 0) return null;

  // Max activity for progress ring scaling
  const maxActivity = Math.max(...displayMembers.map((m) => m.activityCount), 1);

  return (
    <div className="flex items-center gap-3 px-1 py-1">
      {/* Label */}
      <span className="text-[9px] font-mono uppercase tracking-widest text-outline shrink-0 hidden sm:block">
        Team
      </span>

      {/* Avatar bubbles */}
      <div className="flex items-center gap-2 flex-wrap">
        {displayMembers.map((member, i) => {
          const isCurrentUser = member.id === user.id;
          const activityRatio = member.activityCount / maxActivity;
          const ringOpacity = 0.25 + activityRatio * 0.75;
          const isHovered = hoveredId === member.id;

          return (
            <div
              key={member.id}
              className="relative group"
              style={{
                animationDelay: `${i * 60}ms`,
                animation: "memberBubbleIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
              }}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Activity growth ring */}
              <div
                className="absolute -inset-[3px] rounded-full transition-all duration-500"
                style={{
                  background: `conic-gradient(${domainColor} ${activityRatio * 360}deg, transparent 0deg)`,
                  opacity: member.activityCount > 0 ? ringOpacity : 0,
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              />

              {/* Avatar bubble */}
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-xl border-2 transition-all duration-200 cursor-default"
                style={{
                  backgroundColor: isCurrentUser
                    ? `${domainColor}20`
                    : "rgba(255,255,255,0.05)",
                  borderColor: isCurrentUser
                    ? `${domainColor}80`
                    : "rgba(255,255,255,0.12)",
                  boxShadow: isCurrentUser
                    ? `0 0 14px ${domainColor}40`
                    : isHovered
                    ? "0 0 10px rgba(255,255,255,0.1)"
                    : "none",
                  transform: isHovered ? "scale(1.12)" : "scale(1)",
                }}
              >
                <span className="leading-none select-none">{member.avatar}</span>

                {/* Host crown badge */}
                {member.isHost && (
                  <span
                    className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: domainColor }}
                  >
                    <Crown size={8} className="text-obsidian-deep" />
                  </span>
                )}

                {/* "You" badge */}
                {isCurrentUser && !member.isHost && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold px-1 rounded-sm bg-wellness-emerald text-obsidian-deep leading-none py-0.5 whitespace-nowrap">
                    YOU
                  </span>
                )}
              </div>

              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-charcoal-surface border border-white/15 shadow-xl z-20 pointer-events-none"
                  style={{ minWidth: "max-content" }}
                >
                  <p className="text-[11px] font-mono text-white font-semibold leading-tight">
                    {member.avatar} {member.name}
                    {member.isHost && (
                      <span
                        className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: `${domainColor}25`,
                          color: domainColor,
                        }}
                      >
                        HOST
                      </span>
                    )}
                  </p>
                  {member.activityCount > 0 && (
                    <p className="text-[9px] font-mono text-outline mt-0.5">
                      {member.activityCount} board action{member.activityCount !== 1 ? "s" : ""}
                    </p>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/15" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Member count pill when > 4 */}
      {displayMembers.length > 4 && (
        <span className="text-[9px] font-mono text-outline bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          +{displayMembers.length - 4} more
        </span>
      )}

      <style>{`
        @keyframes memberBubbleIn {
          from { opacity: 0; transform: scale(0.6) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
