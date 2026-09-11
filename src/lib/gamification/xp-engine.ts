export interface RankInfo {
  tier: number;
  title: string;
  subTier: string;
  minXp: number;
  maxXp: number;
  progressPercent: number;
}

export const RANK_TIERS = [
  { tier: 1, title: "Operative", subTier: "Tier I", minXp: 0, maxXp: 1000 },
  { tier: 2, title: "Specialist", subTier: "Tier I", minXp: 1000, maxXp: 2500 },
  { tier: 3, title: "Vanguard", subTier: "Tier III", minXp: 2500, maxXp: 5000 },
  { tier: 4, title: "Commander", subTier: "Tier II", minXp: 5000, maxXp: 10000 },
  { tier: 5, title: "Archon", subTier: "Tier I", minXp: 10000, maxXp: 25000 },
  { tier: 6, title: "Sovereign", subTier: "Master", minXp: 25000, maxXp: 50000 },
];

export function calculateUserRank(totalXp: number): RankInfo {
  // Defensive clamp: negative XP (data corruption, rollback edge cases) must
  // never fall through to the Sovereign fallback — it belongs to Tier 1.
  const xp = Math.max(0, totalXp);
  for (let i = 0; i < RANK_TIERS.length; i++) {
    const r = RANK_TIERS[i];
    if (xp >= r.minXp && xp < r.maxXp) {
      const range = r.maxXp - r.minXp;
      const current = xp - r.minXp;
      const progressPercent = Math.min(100, Math.round((current / range) * 100));
      return {
        tier: r.tier,
        title: r.title,
        subTier: r.subTier,
        minXp: r.minXp,
        maxXp: r.maxXp,
        progressPercent,
      };
    }
  }
  const last = RANK_TIERS[RANK_TIERS.length - 1];
  return {
    tier: last.tier,
    title: last.title,
    subTier: last.subTier,
    minXp: last.minXp,
    maxXp: last.maxXp,
    progressPercent: 100,
  };
}

/**
 * Server-side anti-exploit check for Deep Focus sessions.
 * Returns verified XP if session duration aligns with actual wall-clock elapsed time.
 */
export function verifyFocusSession(
  startedAt: Date,
  completedAt: Date,
  durationSeconds: number,
  baseXpRatePerMinute: number = 5
): { isValid: boolean; verifiedXp: number; message: string } {
  const elapsedSeconds = (completedAt.getTime() - startedAt.getTime()) / 1000;

  // Allow a 5% margin for network latency or clock skew
  const minRequiredSeconds = durationSeconds * 0.95;

  if (elapsedSeconds < minRequiredSeconds) {
    return {
      isValid: false,
      verifiedXp: 0,
      message: `Focus session ended too quickly (${Math.round(elapsedSeconds)}s vs ${durationSeconds}s target). Anti-exploit protection triggered.`,
    };
  }

  // Calculate XP based on target duration
  const minutes = Math.floor(durationSeconds / 60);
  const verifiedXp = Math.max(10, minutes * baseXpRatePerMinute);

  return {
    isValid: true,
    verifiedXp,
    message: "Focus session successfully verified by server.",
  };
}
