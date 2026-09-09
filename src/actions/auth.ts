"use server";

import { prisma } from "@/lib/prisma";

export async function registerUserAction(data: {
  email: string;
  callSign: string;
}) {
  try {
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

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function saveOnboardingAction(data: {
  email?: string;
  selectedDomains: string[];
  assignedCompanions: Record<string, string>;
  skills: Record<string, { title: string; engine: string }>;
}) {
  try {
    const targetEmail = data.email || "commander@agency.dev";
    const user = await prisma.user.findFirst({
      where: { email: targetEmail },
    });

    if (!user) return { success: false, error: "User not found" };

    const domainNames: Record<string, { name: string; color: string; defaultPet: string }> = {
      health: { name: "Health & Wellness", color: "#10B981", defaultPet: "Vitality Wolf" },
      work: { name: "Work & Projects", color: "#3B82F6", defaultPet: "Byte Fox" },
      learning: { name: "Learning & Growth", color: "#8B5CF6", defaultPet: "Hydro Dragon" },
      admin: { name: "Home & Life Admin", color: "#64748B", defaultPet: "Aegis Turtle" },
      hobbies: { name: "Hobbies & Fun", color: "#F59E0B", defaultPet: "Zenith Panther" },
      custom: { name: "Custom Domain", color: "#ffffff", defaultPet: "Mystery Egg" },
    };

    for (const slug of data.selectedDomains) {
      const meta = domainNames[slug] || { name: slug, color: "#ffffff", defaultPet: "Companion" };
      const compKey = data.assignedCompanions[slug] || meta.defaultPet;
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
      if (skillConfig) {
        await prisma.task.create({
          data: {
            domainId: domain.id,
            title: skillConfig.title,
            columnId: "TODO",
            isCompleted: false,
            xpReward: 25,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving onboarding to Neon:", error);
    return { success: false, error: String(error) };
  }
}
