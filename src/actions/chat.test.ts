/**
 * Tests for Squad Channel server actions: message send/fetch, quest-log
 * broadcast, and presence heartbeat.
 */

import {
  sendBoardMessageAction,
  getBoardMessagesAction,
  broadcastQuestCompleteAction,
  syncPresenceAction,
} from "./chat";
import { prisma } from "@/lib/prisma";
import { resolveProjectTwinIds } from "@/lib/shared-project";

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn((name: string) => {
      const map: Record<string, string> = {
        pys_uid: "guest-wolf",
        pys_guest_name: "homyak",
        pys_guest_avatar: "🐺",
      };
      return map[name] ? { value: map[name] } : null;
    }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock("@/lib/shared-project", () => ({
  resolveProjectTwinIds: jest.fn(async (id: string) => [id]),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    lifeDomain: {
      findFirst: jest.fn(),
    },
    boardMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    boardPresence: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserFindMany = prisma.user.findMany as jest.Mock;
const mockLifeDomain = prisma.lifeDomain.findFirst as jest.Mock;
const mockMessageCreate = prisma.boardMessage.create as jest.Mock;
const mockMessageFindMany = prisma.boardMessage.findMany as jest.Mock;
const mockPresenceUpsert = prisma.boardPresence.upsert as jest.Mock;
const mockPresenceFindMany = prisma.boardPresence.findMany as jest.Mock;

const mockTwinIds = resolveProjectTwinIds as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockTwinIds.mockImplementation(async (id: string) => [id]);
});

describe("sendBoardMessageAction", () => {
  it("rejects empty messages", async () => {
    const res = await sendBoardMessageAction("board-1", "   ");
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("creates a TEXT message with sender companion badge", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "guest-wolf",
      callSign: "homyak",
      avatar: "🐺",
    });
    mockLifeDomain.mockResolvedValue({
      avatarSpecies: "Vitality Wolf",
      level: 12,
    });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      boardId: "board-1",
      userId: "guest-wolf",
      content: "Let's ship it!",
      type: "TEXT",
      companionBadge: "Vitality Wolf Lv.12",
      xpRewardYield: null,
      createdAt: new Date("2026-09-20T10:00:00Z"),
      user: { callSign: "homyak", avatar: "🐺" },
    });

    const res = await sendBoardMessageAction("board-1", "Let's ship it!");

    expect(res.success).toBe(true);
    expect(res.message?.content).toBe("Let's ship it!");
    expect(res.message?.companionBadge).toBe("Vitality Wolf Lv.12");
    expect(res.message?.userName).toBe("homyak");
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          boardId: "board-1",
          content: "Let's ship it!",
          type: "TEXT",
          companionBadge: "Vitality Wolf Lv.12",
        }),
      })
    );
  });
});

describe("getBoardMessagesAction", () => {
  it("unions twin project ids when fetching history", async () => {
    mockTwinIds.mockResolvedValue(["board-1", "twin-2"]);
    mockMessageFindMany.mockResolvedValue([]);

    await getBoardMessagesAction("board-1");

    expect(mockMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ boardId: { in: ["board-1", "twin-2"] } }),
        orderBy: { createdAt: "asc" },
      })
    );
  });

  it("returns message history sorted ascending", async () => {
    mockMessageFindMany.mockResolvedValue([
      {
        id: "m1",
        boardId: "board-1",
        userId: "u1",
        content: "hello",
        type: "TEXT",
        companionBadge: null,
        xpRewardYield: null,
        createdAt: new Date("2026-09-20T09:00:00Z"),
        user: { callSign: "A", avatar: "🐺" },
      },
      {
        id: "m2",
        boardId: "board-1",
        userId: "u2",
        content: "hi",
        type: "TEXT",
        companionBadge: null,
        xpRewardYield: null,
        createdAt: new Date("2026-09-20T09:05:00Z"),
        user: { callSign: "B", avatar: "🦊" },
      },
    ]);

    const res = await getBoardMessagesAction("board-1");

    expect(res.success).toBe(true);
    expect(res.messages).toHaveLength(2);
    expect(res.messages[0].content).toBe("hello");
    expect(res.messages[1].content).toBe("hi");
  });
});

describe("broadcastQuestCompleteAction", () => {
  it("creates a SYSTEM_QUEST_LOG message with XP yield", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "guest-wolf",
      callSign: "homyak",
      avatar: "🐺",
    });
    mockLifeDomain.mockResolvedValue(null);
    mockMessageCreate.mockResolvedValue({
      id: "quest-1",
      boardId: "board-1",
      userId: "guest-wolf",
      content: "Morning 5km Run",
      type: "SYSTEM_QUEST_LOG",
      companionBadge: null,
      xpRewardYield: 150,
      createdAt: new Date("2026-09-20T10:00:00Z"),
      user: { callSign: "homyak", avatar: "🐺" },
    });

    const res = await broadcastQuestCompleteAction("board-1", "Morning 5km Run", 150);

    expect(res.success).toBe(true);
    expect(res.message?.type).toBe("SYSTEM_QUEST_LOG");
    expect(res.message?.xpRewardYield).toBe(150);
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "SYSTEM_QUEST_LOG",
          xpRewardYield: 150,
        }),
      })
    );
  });
});

describe("syncPresenceAction", () => {
  it("upserts the current user's heartbeat and returns online squad", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "guest-wolf",
      callSign: "homyak",
      avatar: "🐺",
    });
    mockLifeDomain.mockResolvedValue(null);
    mockPresenceUpsert.mockResolvedValue({});
    mockPresenceFindMany.mockResolvedValue([
      { userId: "guest-wolf", isFocusing: true, lastSeenAt: new Date() },
    ]);
    mockUserFindMany.mockResolvedValue([
      { id: "guest-wolf", callSign: "homyak", avatar: "🐺" },
    ]);

    const res = await syncPresenceAction("board-1", true);

    expect(mockPresenceUpsert).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.presence).toHaveLength(1);
    expect(res.presence[0].name).toBe("homyak");
    expect(res.presence[0].isFocusing).toBe(true);
  });
});
