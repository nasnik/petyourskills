"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { SkillRepeatConfig } from "@/types";

/** Cookie name used to track the current DB user across auth states */
const PYS_UID_COOKIE = "pys_uid";
/** Cookie tracking which shared project an anonymous guest joined */
const PYS_SHARED_COOKIE = "pys_shared";

/** Sets the pys_uid cookie to identify the logged-in DB user */
async function setPysUidCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PYS_UID_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** Clears the pys_uid cookie on sign-out */
export async function clearPysUidCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PYS_UID_COOKIE);
  cookieStore.delete(PYS_SHARED_COOKIE);
}

/**
 * Transfers an anonymous guest session (board memberships + shared project
 * reference) onto a real user record, then removes the guest record.
 */
async function transferGuestSessionToUser(targetUserId: string, guestId: string) {
  if (targetUserId === guestId) return;
  try {
    const guest = await prisma.user.findUnique({ where: { id: guestId } });
    if (!guest?.isAnonymous) return;

    await prisma.boardMember
      .updateMany({ where: { userId: guestId }, data: { userId: targetUserId } })
      .catch(() => {});

    if (guest.sharedProjectId) {
      await prisma.user
        .update({
          where: { id: targetUserId },
          data: { sharedProjectId: guest.sharedProjectId },
        })
        .catch(() => {});
    }

    await prisma.user.delete({ where: { id: guestId } }).catch(() => {});
  } catch (error) {
    console.error("Error transferring guest session:", error);
  }
}

/** Reads the pys_uid cookie value (server-side only) */
export async function getPysUidFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
}

/** Synchronizes the pys_uid cookie for a user signing in with their email */
export async function syncUserSessionAction(data: { email: string }) {
  try {
    // Preserve any anonymous guest session so shared project access carries over
    const guestUid = await getPysUidFromCookie();

    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Create user record in Neon DB if not exists
      user = await prisma.user.create({
        data: {
          email: data.email,
          callSign: data.email.split("@")[0],
          rankTier: 1,
          totalXp: 0,
        },
      });
    }

    if (guestUid && guestUid !== user.id) {
      await transferGuestSessionToUser(user.id, guestUid);
      // Re-read in case the shared project reference was transferred
      user = (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;
    }

    await setPysUidCookie(user.id);
    return { success: true, user };
  } catch (error) {
    console.error("Error syncing user session:", error);
    return { success: false, error: String(error) };
  }
}

export async function registerUserAction(data: {
  email: string;
  callSign: string;
}) {
  try {
    // If the current session is an anonymous guest (joined via passkey),
    // upgrade THAT record so shared project access persists after sign-up.
    const guestUid = await getPysUidFromCookie();
    if (guestUid) {
      const guest = await prisma.user
        .findUnique({ where: { id: guestUid } })
        .catch(() => null);

      if (guest?.isAnonymous) {
        const existing = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existing && existing.id !== guest.id) {
          // Email already has an account — transfer guest access onto it
          await transferGuestSessionToUser(existing.id, guest.id);
          const merged = await prisma.user.update({
            where: { id: existing.id },
            data: { callSign: data.callSign },
          });
          await setPysUidCookie(merged.id);
          return { success: true, user: merged, upgradedFromGuest: true };
        }

        const upgraded = await prisma.user.update({
          where: { id: guest.id },
          data: {
            email: data.email,
            callSign: data.callSign,
            isAnonymous: false,
          },
        });
        await setPysUidCookie(upgraded.id);
        return { success: true, user: upgraded, upgradedFromGuest: true };
      }
    }

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        callSign: data.callSign,
      },
      create: {
        email: data.email,
        callSign: data.callSign,
        rankTier: 1,
        totalXp: 0,
      },
    });

    // Persist the DB user ID in a server-side cookie so both the onboarding
    // action and the dashboard layout can identify this user even before
    // Supabase email confirmation is completed.
    await setPysUidCookie(user.id);

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function saveOnboardingAction(data: {
  selectedDomains: string[];
  assignedCompanions: Record<string, string>;
  skills: Record<string, { title: string; engine: string; repeatConfig?: SkillRepeatConfig }>;
  email?: string;
  customDomainName?: string;
  customDomainColor?: string;
}) {
  try {
    // 1. Resolve current user: try pys_uid cookie first
    const uid = await getPysUidFromCookie();

    let user = uid
      ? await prisma.user.findUnique({ where: { id: uid } })
      : null;

    // 2. Try Supabase server session
    if (!user) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser?.email) {
          user = await prisma.user.findUnique({ where: { email: authUser.email } });
        }
      } catch {
        // Ignore Supabase error and check email fallback
      }
    }

    // 3. Fallback to passed email
    if (!user && data.email) {
      user = await prisma.user.findUnique({ where: { email: data.email } });
    }

    if (!user) {
      return { success: false, error: "User not found. Please sign up again." };
    }

    // Ensure the cookie is set for subsequent dashboard loads
    await setPysUidCookie(user.id);

    const customName = data.customDomainName?.trim() || "Custom Domain";
    const customColor = data.customDomainColor || "#06B6D4";

    const domainNames: Record<string, { name: string; color: string; defaultPet: string }> = {
      health: { name: "Health & Wellness", color: "#10B981", defaultPet: "Vitality Wolf" },
      work: { name: "Work & Projects", color: "#3B82F6", defaultPet: "Byte Fox" },
      learning: { name: "Learning & Growth", color: "#8B5CF6", defaultPet: "Hydro Dragon" },
      admin: { name: "Home & Life Admin", color: "#64748B", defaultPet: "Aegis Turtle" },
      hobbies: { name: "Hobbies & Fun", color: "#F59E0B", defaultPet: "Zenith Panther" },
      custom: { name: customName, color: customColor, defaultPet: "Mystery Egg" },
    };

    const companionNameMap: Record<string, string> = {
      "wisdom-owl": "Wisdom Owl",
      "byte-fox": "Byte Fox",
      "hydro-dragon": "Hydro Dragon",
      "aegis-turtle": "Aegis Turtle",
      "zenith-panther": "Zenith Panther",
      "mystery-egg": "Mystery Egg",
      "vitality-wolf": "Vitality Wolf",
    };

    for (const slug of data.selectedDomains) {
      const meta = domainNames[slug] || { name: slug, color: "#ffffff", defaultPet: "Companion" };
      const rawComp = data.assignedCompanions[slug];
      const compKey = (rawComp && companionNameMap[rawComp]) || rawComp || meta.defaultPet;
      const domainId = `dom-${slug}-${user.id.slice(0, 8)}`;

      const domain = await prisma.lifeDomain.upsert({
        where: { id: domainId },
        update: {
          name: meta.name,
          accentColor: meta.color,
          avatarSpecies: compKey,
          isActive: true,
        },
        create: {
          id: domainId,
          userId: user.id,
          name: meta.name,
          slug,
          accentColor: meta.color,
          avatarSpecies: compKey,
          level: 1,
          currentXp: 0,
          isActive: true,
        },
      });

      const skillConfig = data.skills[slug];
      const petTitle = skillConfig?.title || `${compKey} Guardian`;
      const petId = `pet-${slug}-${user.id.slice(0, 8)}`;

      await prisma.skillPet.upsert({
        where: { id: petId },
        update: {
          title: petTitle,
          planningEngineType: skillConfig?.engine || "DAILY_ROUTINE",
        },
        create: {
          id: petId,
          domainId: domain.id,
          title: petTitle,
          level: 1,
          currentXp: 0,
          nextEvolutionThreshold: 1000,
          planningEngineType: skillConfig?.engine || "DAILY_ROUTINE",
        },
      });

      if (skillConfig) {
        const repeatConfigPayload =
          skillConfig.repeatConfig || { engine: skillConfig.engine || "DAILY_ROUTINE" };

        const createdTask = await prisma.task.create({
          data: {
            domainId: domain.id,
            title: skillConfig.title,
            columnId: "TODO",
            isCompleted: false,
            xpReward: 25,
            repeatConfig: repeatConfigPayload as any,
          },
        });

        if (skillConfig.engine === "MULTI_TASK") {
          try {
            await prisma.task.createMany({
              data: [
                {
                  domainId: domain.id,
                  boardId: createdTask.id,
                  title: `Milestone 1: Project Scope & Setup`,
                  columnId: "TODO",
                  isCompleted: false,
                  xpReward: 30,
                  estimatedMinutes: 25,
                  sortOrder: 1,
                },
                {
                  domainId: domain.id,
                  boardId: createdTask.id,
                  title: `Milestone 2: Core Implementation Sprint`,
                  columnId: "IN_PROGRESS",
                  isCompleted: false,
                  xpReward: 50,
                  estimatedMinutes: 45,
                  sortOrder: 2,
                },
              ],
            });
          } catch {}
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving onboarding to Neon:", error);
    return { success: false, error: String(error) };
  }
}
