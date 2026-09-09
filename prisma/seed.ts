import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Neon database...");

  // 1. Create or upsert user
  const user = await prisma.user.upsert({
    where: { email: "commander@agency.dev" },
    update: {
      callSign: "Anastasia Nikulina",
      rankTier: 4,
      totalXp: 4600,
    },
    create: {
      id: "usr-anastasia-01",
      email: "commander@agency.dev",
      callSign: "Anastasia Nikulina",
      rankTier: 4,
      totalXp: 4600,
    },
  });

  console.log("✓ User seeded:", user.callSign);

  // 2. Create life domains
  const health = await prisma.lifeDomain.upsert({
    where: { id: "dom-health" },
    update: {},
    create: {
      id: "dom-health",
      userId: user.id,
      name: "Health & Wellness",
      slug: "health",
      accentColor: "#10B981",
      avatarSpecies: "Vitality Wolf",
      level: 15,
      currentXp: 3400,
      isActive: true,
    },
  });

  const work = await prisma.lifeDomain.upsert({
    where: { id: "dom-work" },
    update: {},
    create: {
      id: "dom-work",
      userId: user.id,
      name: "Work & Projects",
      slug: "work",
      accentColor: "#3B82F6",
      avatarSpecies: "Byte Fox",
      level: 90,
      currentXp: 8200,
      isActive: true,
    },
  });

  const learning = await prisma.lifeDomain.upsert({
    where: { id: "dom-learning" },
    update: {},
    create: {
      id: "dom-learning",
      userId: user.id,
      name: "Learning & Growth",
      slug: "learning",
      accentColor: "#8B5CF6",
      avatarSpecies: "Hydro Dragon",
      level: 70,
      currentXp: 4500,
      isActive: true,
    },
  });

  const volunteering = await prisma.lifeDomain.upsert({
    where: { id: "dom-volunteering" },
    update: {},
    create: {
      id: "dom-volunteering",
      userId: user.id,
      name: "Volunteering",
      slug: "volunteering",
      accentColor: "#F59E0B",
      avatarSpecies: "Wisdom Owl",
      level: 38,
      currentXp: 2100,
      isActive: true,
    },
  });

  console.log("✓ Domains seeded: Health, Work, Learning, Volunteering");

  // 3. Create default Kanban Board
  const board = await prisma.kanbanBoard.upsert({
    where: { id: "board-main" },
    update: {},
    create: {
      id: "board-main",
      domainId: work.id,
      ownerId: user.id,
      title: "Pet Your Skills Initiatives",
      isShared: true,
      passCode: "VANGUARD-8941",
      inviteToken: "sec_9941_aegis",
    },
  });

  console.log("✓ Kanban board seeded:", board.title);

  // 4. Create tasks
  const sampleTasks = [
    {
      id: "task-1",
      domainId: work.id,
      boardId: board.id,
      title: "Complete Dashboard Wireframe",
      columnId: "TODO",
      isCompleted: false,
      xpReward: 250,
      estimatedMinutes: 45,
      sortOrder: 1,
    },
    {
      id: "task-2",
      domainId: health.id,
      boardId: board.id,
      title: "Morning 5km Run",
      columnId: "DONE",
      isCompleted: true,
      doneAt: new Date("2026-09-07T07:30:00Z"),
      xpReward: 150,
      estimatedMinutes: 30,
      sortOrder: 2,
    },
    {
      id: "task-3",
      domainId: learning.id,
      boardId: board.id,
      title: "System Architecture Review (NodeJS)",
      columnId: "IN_PROGRESS",
      isCompleted: false,
      xpReward: 200,
      estimatedMinutes: 30,
      sortOrder: 3,
    },
    {
      id: "task-4",
      domainId: work.id,
      boardId: board.id,
      title: "Refactor Auth Middleware for multi-tenant support",
      columnId: "IN_PROGRESS",
      isCompleted: false,
      xpReward: 120,
      estimatedMinutes: 45,
      sortOrder: 4,
    },
    {
      id: "task-5",
      domainId: work.id,
      boardId: board.id,
      title: "Update onboarding email sequence drafts",
      columnId: "REVIEW",
      isCompleted: false,
      xpReward: 40,
      estimatedMinutes: 20,
      sortOrder: 5,
    },
    {
      id: "task-6",
      domainId: work.id,
      boardId: board.id,
      title: "Configure Vercel deployment pipeline",
      columnId: "DONE",
      isCompleted: true,
      doneAt: new Date("2026-09-07T14:15:00Z"),
      xpReward: 100,
      estimatedMinutes: 60,
      sortOrder: 6,
    },
    {
      id: "task-7",
      domainId: health.id,
      boardId: board.id,
      title: "Daily 10000 steps",
      columnId: "DONE",
      isCompleted: true,
      doneAt: new Date("2026-09-07T17:38:00Z"),
      xpReward: 25,
      estimatedMinutes: null,
      sortOrder: 7,
    },
    {
      id: "task-8",
      domainId: health.id,
      boardId: board.id,
      title: "Doctor appointment",
      columnId: "TODO",
      isCompleted: false,
      xpReward: 50,
      estimatedMinutes: 60,
      sortOrder: 8,
    },
  ];

  for (const t of sampleTasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  console.log("✓ Tasks seeded successfully:", sampleTasks.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log("🚀 Seeding finished successfully against Neon PostgreSQL!");
  })
  .catch(async (e) => {
    console.error("Error during seed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
