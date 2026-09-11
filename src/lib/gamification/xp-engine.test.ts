import {
  calculateUserRank,
  RANK_TIERS,
  verifyFocusSession,
} from "./xp-engine";

describe("calculateUserRank", () => {
  it("places a new user at Tier 1 (Operative)", () => {
    const rank = calculateUserRank(0);
    expect(rank.tier).toBe(1);
    expect(rank.title).toBe("Operative");
    expect(rank.minXp).toBe(0);
    expect(rank.maxXp).toBe(1000);
    expect(rank.progressPercent).toBe(0);
  });

  it("computes progress within the first tier", () => {
    // 500 XP into a 1000 XP range → 50%
    const rank = calculateUserRank(500);
    expect(rank.tier).toBe(1);
    expect(rank.progressPercent).toBe(50);
  });

  it("advances to tier 2 at the 1000 XP boundary", () => {
    const rank = calculateUserRank(1000);
    expect(rank.tier).toBe(2);
    expect(rank.title).toBe("Specialist");
    expect(rank.progressPercent).toBe(0);
  });

  it("computes progress within an interior tier", () => {
    // 3000 XP → Specialist range (1000–2500), Vanguard range (2500–5000).
    // 500 XP into a 2500 XP range → 20%
    const rank = calculateUserRank(3000);
    expect(rank.tier).toBe(3);
    expect(rank.progressPercent).toBe(20);
  });

  it("returns the last tier for XP at or beyond Sovereign", () => {
    const rank = calculateUserRank(50000);
    expect(rank.tier).toBe(RANK_TIERS.length);
    expect(rank.title).toBe("Sovereign");
    expect(rank.progressPercent).toBe(100);
  });

  it("caps XP far beyond the final tier at Sovereign", () => {
    const rank = calculateUserRank(1_000_000);
    expect(rank.tier).toBe(6);
    expect(rank.title).toBe("Sovereign");
    expect(rank.progressPercent).toBe(100);
  });

  it("never assigns negative XP to a higher tier", () => {
    const rank = calculateUserRank(-5);
    expect(rank.tier).toBe(1);
    expect(rank.progressPercent).toBe(0);
  });
});

describe("verifyFocusSession", () => {
  const now = new Date("2026-09-10T12:00:00Z");

  it("rejects sessions that ended suspiciously fast (anti-exploit)", () => {
    const result = verifyFocusSession(
      now,
      new Date(now.getTime() + 10_000), // 10s elapsed
      25 * 60, // but claimed a 25-minute session
      5
    );
    expect(result.isValid).toBe(false);
    expect(result.verifiedXp).toBe(0); // no XP for exploited sessions
    expect(result.message).toContain("Anti-exploit");
  });

  it("awards XP proportional to the target duration for honest sessions", () => {
    const result = verifyFocusSession(
      now,
      new Date(now.getTime() + 26 * 60 * 1000), // 26 min elapsed
      25 * 60, // 25-minute target
      5
    );
    expect(result.isValid).toBe(true);
    expect(result.verifiedXp).toBe(25 * 5); // 5 XP per minute
  });

  it("tolerates up to 5% clock skew / latency below the target duration", () => {
    const result = verifyFocusSession(
      now,
      new Date(now.getTime() + 0.95 * 25 * 60 * 1000), // exactly 95% of target
      25 * 60,
      5
    );
    expect(result.isValid).toBe(true);
  });

  it("enforces the 10 XP minimum for very short verified sessions", () => {
    const result = verifyFocusSession(
      now,
      new Date(now.getTime() + 31_000), // 31s elapsed
      30, // 30-second target → floor(30/60)=0 minutes → 0 XP, clamped to 10
      5
    );
    expect(result.isValid).toBe(true);
    expect(result.verifiedXp).toBe(10);
  });

  it("floors partial minutes instead of rounding up", () => {
    const result = verifyFocusSession(
      now,
      new Date(now.getTime() + 4 * 60 * 1000 + 59_000), // ~5 min elapsed
      4 * 60 + 30, // 4.5-minute target → floor(270/60)=4 minutes → 20 XP
      5
    );
    expect(result.verifiedXp).toBe(20);
  });
});