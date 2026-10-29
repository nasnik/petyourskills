"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  PYS_GUEST_AVATAR_COOKIE,
  PYS_GUEST_NAME_COOKIE,
} from "@/lib/collaboration";
import { resolveProjectTwinIds } from "@/lib/shared-project";
import { BoardMessageItem, MessageType, SquadPresence } from "@/types";

/** Cookie tracking the current DB user (same cookie used by collaboration/auth). */
const PYS_UID_COOKIE = "pys_uid";

/** Presence rows older than this (ms) are considered offline. */
const PRESENCE_STALE_MS = 10_000;
/** How many recent messages to return on initial load. */
const DEFAULT_LIMIT = 100;

interface SenderIdentity {
  userId: string;
  name: string;
  avatar: string;
  companionBadge: string | null;
}

/**
 * Resolves the current session user's identity (name, avatar, companion
 * badge) from cookies + DB so chat messages carry correct sender metadata.
 */
async function resolveSenderIdentity(): Promise<SenderIdentity | null> {
  const cookieStore = await cookies();
  const uid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
  const guestName = cookieStore.get(PYS_GUEST_NAME_COOKIE)?.value ?? null;
  const guestAvatar = cookieStore.get(PYS_GUEST_AVATAR_COOKIE)?.value ?? null;

  if (!uid) return null;

  // Demo guest (no DB record) — derive identity purely from cookies.
  if (uid.startsWith("guest-demo-")) {
    return {
      userId: uid,
      name: guestName?.trim() || "Guest Collaborator",
      avatar: guestAvatar?.trim() || "🐾",
      companionBadge: null,
    };
  }

  const user = await prisma.user
    .findUnique({ where: { id: uid }, select: { id: true, callSign: true, avatar: true } })
    .catch(() => null);

  if (!user) {
    return {
      userId: uid,
      name: guestName?.trim() || "Guest Collaborator",
      avatar: guestAvatar?.trim() || "🐾",
      companionBadge: null,
    };
  }

  // Companion badge: the user's most active domain companion (species + level).
  const domain = await prisma.lifeDomain
    .findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { currentXp: "desc" },
      select: { avatarSpecies: true, level: true },
    })
    .catch(() => null);

  const companionBadge = domain
    ? `${domain.avatarSpecies} Lv.${domain.level}`
    : null;

  return {
    userId: user.id,
    name: user.callSign && user.callSign !== "Guest Collaborator"
      ? user.callSign
      : guestName?.trim() || user.callSign,
    avatar: user.avatar?.trim() || guestAvatar?.trim() || "🐾",
    companionBadge,
  };
}

/** Maps a DB BoardMessage row to the client BoardMessageItem shape. */
function mapMessage(row: {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  type: MessageType;
  companionBadge: string | null;
  xpRewardYield: number | null;
  createdAt: Date;
  user?: { callSign: string; avatar: string | null } | null;
}): BoardMessageItem {
  return {
    id: row.id,
    boardId: row.boardId,
    userId: row.userId,
    userName: row.user?.callSign,
    userAvatar: row.user?.avatar || undefined,
    content: row.content,
    type: row.type,
    companionBadge: row.companionBadge,
    xpRewardYield: row.xpRewardYield,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Sends a TEXT chat message to a shared project board and returns the created
 * message so the sender can optimistically append it.
 */
export async function sendBoardMessageAction(
  boardId: string,
  content: string
): Promise<{ success: boolean; message?: BoardMessageItem; error?: string }> {
  const clean = content?.trim();
  if (!clean) return { success: false, error: "Message cannot be empty." };

  const sender = await resolveSenderIdentity();
  if (!sender) return { success: false, error: "No active session." };

  try {
    const created = await prisma.boardMessage.create({
      data: {
        boardId,
        userId: sender.userId,
        content: clean,
        type: "TEXT",
        companionBadge: sender.companionBadge,
      },
      include: { user: { select: { callSign: true, avatar: true } } },
    });
    return { success: true, message: mapMessage(created) };
  } catch (error) {
    console.error("[sendBoardMessageAction] error:", error);
    return { success: false, error: "Could not save the message." };
  }
}

/**
 * Fetches message history for a shared project. Messages are stored under any
 * of the project's twin ids, so reads union all equivalent ids.
 */
export async function getBoardMessagesAction(
  boardId: string,
  limit: number = DEFAULT_LIMIT
): Promise<{ success: boolean; messages: BoardMessageItem[]; error?: string }> {
  try {
    const ids = await resolveProjectTwinIds(boardId).catch(() => [boardId]);
    const rows = await prisma.boardMessage.findMany({
      where: { boardId: { in: ids } },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { user: { select: { callSign: true, avatar: true } } },
    });
    return { success: true, messages: rows.map(mapMessage) };
  } catch (error) {
    console.error("[getBoardMessagesAction] error:", error);
    return { success: false, messages: [], error: String(error) };
  }
}

/**
 * Broadcasts an automated SYSTEM_QUEST_LOG message when a task/card is
 * completed on the board, celebrating the member's discipline in the channel.
 */
export async function broadcastQuestCompleteAction(
  boardId: string,
  taskTitle: string,
  xpReward: number
): Promise<{ success: boolean; message?: BoardMessageItem; error?: string }> {
  const sender = await resolveSenderIdentity();
  if (!sender) return { success: false, error: "No active session." };

  try {
    const created = await prisma.boardMessage.create({
      data: {
        boardId,
        userId: sender.userId,
        content: taskTitle,
        type: "SYSTEM_QUEST_LOG",
        companionBadge: sender.companionBadge,
        xpRewardYield: xpReward,
      },
      include: { user: { select: { callSign: true, avatar: true } } },
    });
    return { success: true, message: mapMessage(created) };
  } catch (error) {
    console.error("[broadcastQuestCompleteAction] error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Records the current session user's presence heartbeat for a board and
 * returns the current online squad (used for the "X Online" pill and the
 * Shared Focus buff detection).
 */
export async function syncPresenceAction(
  boardId: string,
  isFocusing: boolean
): Promise<{ success: boolean; presence: SquadPresence[]; error?: string }> {
  const sender = await resolveSenderIdentity();
  if (!sender) return { success: false, presence: [], error: "No active session." };

  try {
    await prisma.boardPresence.upsert({
      where: { boardId_userId: { boardId, userId: sender.userId } },
      update: { isFocusing, lastSeenAt: new Date() },
      create: { boardId, userId: sender.userId, isFocusing },
    });

    const staleBefore = new Date(Date.now() - PRESENCE_STALE_MS);
    const active = await prisma.boardPresence.findMany({
      where: { boardId, lastSeenAt: { gt: staleBefore } },
    });

    // Enrich presence rows with member identity.
    const userIds = active.map((r) => r.userId);
    const users = await prisma.user
      .findMany({ where: { id: { in: userIds } }, select: { id: true, callSign: true, avatar: true } })
      .catch(() => [] as { id: string; callSign: string; avatar: string | null }[]);
    const byId = new Map(users.map((u) => [u.id, u]));

    const presence: SquadPresence[] = active.map((r) => {
      const u = byId.get(r.userId);
      return {
        userId: r.userId,
        name: u?.callSign || (r.userId === sender.userId ? sender.name : "Collaborator"),
        avatar: u?.avatar?.trim() || (r.userId === sender.userId ? sender.avatar : "🐾"),
        isFocusing: r.isFocusing,
        onlineAt: r.lastSeenAt.toISOString(),
      };
    });

    // Demo guests have no user row — ensure they appear.
    if (!byId.has(sender.userId) && !active.some((r) => r.userId === sender.userId)) {
      presence.push({
        userId: sender.userId,
        name: sender.name,
        avatar: sender.avatar,
        isFocusing,
        onlineAt: new Date().toISOString(),
      });
    }

    return { success: true, presence };
  } catch (error) {
    console.error("[syncPresenceAction] error:", error);
    return { success: false, presence: [], error: String(error) };
  }
}

/**
 * Returns the last recorded presence snapshot without writing a heartbeat.
 * Used to seed the presence pill before the first sync ticks.
 */
export async function getSquadPresenceAction(
  boardId: string
): Promise<{ success: boolean; presence: SquadPresence[]; error?: string }> {
  try {
    const staleBefore = new Date(Date.now() - PRESENCE_STALE_MS);
    const active = await prisma.boardPresence.findMany({
      where: { boardId, lastSeenAt: { gt: staleBefore } },
    });
    const users = await prisma.user
      .findMany({
        where: { id: { in: active.map((r) => r.userId) } },
        select: { id: true, callSign: true, avatar: true },
      })
      .catch(() => [] as { id: string; callSign: string; avatar: string | null }[]);
    const byId = new Map(users.map((u) => [u.id, u]));

    const presence: SquadPresence[] = active.map((r) => ({
      userId: r.userId,
      name: byId.get(r.userId)?.callSign || "Collaborator",
      avatar: byId.get(r.userId)?.avatar?.trim() || "🐾",
      isFocusing: r.isFocusing,
      onlineAt: r.lastSeenAt.toISOString(),
    }));

    return { success: true, presence };
  } catch (error) {
    console.error("[getSquadPresenceAction] error:", error);
    return { success: false, presence: [], error: String(error) };
  }
}
