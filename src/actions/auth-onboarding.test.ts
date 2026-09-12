import { saveOnboardingAction } from "./auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: "user-1234-abcd" }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    lifeDomain: {
      upsert: jest.fn(),
    },
    skillPet: {
      upsert: jest.fn(),
    },
    task: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

describe("saveOnboardingAction with multi-skill support", () => {
  const mockUser = {
    id: "user-1234-abcd",
    email: "operative@example.com",
    callSign: "Operative",
  };

  const mockCookieStore = {
    get: jest.fn().mockReturnValue({ value: "user-1234-abcd" }),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as unknown as jest.Mock).mockResolvedValue(mockCookieStore);
    mockCookieStore.get.mockReturnValue({ value: "user-1234-abcd" });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.lifeDomain.upsert as jest.Mock).mockImplementation(async ({ create }) => ({
      ...create,
      id: create.id,
    }));
    (prisma.skillPet.upsert as jest.Mock).mockImplementation(async ({ create }) => ({
      ...create,
      id: create.id,
    }));
    (prisma.task.create as jest.Mock).mockImplementation(async ({ data }) => ({
      ...data,
      id: `task-${Math.random()}`,
    }));
    (prisma.task.createMany as jest.Mock).mockResolvedValue({ count: 2 });
  });

  it("successfully persists multiple skills under the same domain", async () => {
    const result = await saveOnboardingAction({
      selectedDomains: ["work"],
      assignedCompanions: { work: "wisdom-owl" },
      skills: {
        work: [
          {
            title: "Frontend Engineering",
            engine: "DAILY_ROUTINE",
            repeatConfig: { engine: "DAILY_ROUTINE", frequency: "daily" },
          },
          {
            title: "Mobile App MVP",
            engine: "MULTI_TASK",
            repeatConfig: { engine: "MULTI_TASK", frequency: "multi_task" },
          },
          {
            title: "DevOps Certification",
            engine: "SPECIFIC_DATE",
            repeatConfig: { engine: "SPECIFIC_DATE", frequency: "specific_date" },
          },
        ],
      },
    });

    expect(result.success).toBe(true);

    // 1. LifeDomain upserted for work
    expect(prisma.lifeDomain.upsert).toHaveBeenCalledTimes(1);

    // 2. SkillPets upserted for each of the 3 skills
    expect(prisma.skillPet.upsert).toHaveBeenCalledTimes(3);

    const petUpsertCalls = (prisma.skillPet.upsert as jest.Mock).mock.calls;
    expect(petUpsertCalls[0][0].create.title).toBe("Frontend Engineering");
    expect(petUpsertCalls[0][0].create.planningEngineType).toBe("DAILY_ROUTINE");

    expect(petUpsertCalls[1][0].create.title).toBe("Mobile App MVP");
    expect(petUpsertCalls[1][0].create.planningEngineType).toBe("MULTI_TASK");

    expect(petUpsertCalls[2][0].create.title).toBe("DevOps Certification");
    expect(petUpsertCalls[2][0].create.planningEngineType).toBe("SPECIFIC_DATE");

    // 3. Tasks created for all 3 skills
    expect(prisma.task.create).toHaveBeenCalledTimes(3);

    // 4. Milestone tasks created for the MULTI_TASK skill
    expect(prisma.task.createMany).toHaveBeenCalledTimes(1);
    const milestoneCall = (prisma.task.createMany as jest.Mock).mock.calls[0][0];
    expect(milestoneCall.data).toHaveLength(2);
    expect(milestoneCall.data[0].title).toContain("Milestone 1");
  });

  it("preserves backward compatibility when skills are passed as a single object per domain", async () => {
    const result = await saveOnboardingAction({
      selectedDomains: ["health"],
      assignedCompanions: { health: "byte-fox" },
      skills: {
        health: {
          title: "Marathon Training",
          engine: "CUSTOM_SCHEDULE",
          repeatConfig: { engine: "CUSTOM_SCHEDULE", frequency: "weekdays" },
        },
      },
    });

    expect(result.success).toBe(true);
    expect(prisma.lifeDomain.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.skillPet.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.task.create).toHaveBeenCalledTimes(1);

    const taskCall = (prisma.task.create as jest.Mock).mock.calls[0][0];
    expect(taskCall.data.title).toBe("Marathon Training");
  });

  it("handles multiple domains with different skill counts", async () => {
    const result = await saveOnboardingAction({
      selectedDomains: ["work", "learning"],
      assignedCompanions: { work: "wisdom-owl", learning: "hydro-dragon" },
      skills: {
        work: [
          {
            title: "Architecture Refactoring",
            engine: "MULTI_TASK",
          },
          {
            title: "Daily Standup Routine",
            engine: "DAILY_ROUTINE",
          },
        ],
        learning: [
          {
            title: "Japanese Language",
            engine: "DAILY_ROUTINE",
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    expect(prisma.lifeDomain.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.skillPet.upsert).toHaveBeenCalledTimes(3);
    expect(prisma.task.create).toHaveBeenCalledTimes(3);
  });

  it("returns error if user cannot be resolved", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await saveOnboardingAction({
      selectedDomains: ["work"],
      assignedCompanions: {},
      skills: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("User not found");
  });
});
