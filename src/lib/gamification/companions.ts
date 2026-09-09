export interface CompanionDefinition {
  id: string;
  species: string;
  domainSlug: string;
  domainName: string;
  accentColor: string;
  badge: string;
  tagline: string;
  evolutionStages: {
    tier: number;
    title: string;
    xpThreshold: number;
    unlockedForm: string;
    perk: string;
  }[];
}

export const COMPANIONS: Record<string, CompanionDefinition> = {
  "vitality-wolf": {
    id: "vitality-wolf",
    species: "Vitality Wolf",
    domainSlug: "health",
    domainName: "Health & Wellness",
    accentColor: "#10B981",
    badge: "Tier 2 Companion",
    tagline: "Empowered by physical conditioning, sleep consistency, and hydration habits.",
    evolutionStages: [
      { tier: 1, title: "Puppy Spark", xpThreshold: 0, unlockedForm: "Basic Wolf", perk: "Base Energy" },
      { tier: 2, title: "Vitality Wolf", xpThreshold: 2000, unlockedForm: "Alpha Radiance", perk: "+15% Focus Length" },
      { tier: 3, title: "Celestial Fenrir", xpThreshold: 6000, unlockedForm: "Astral Beast", perk: "Double Recovery Pulse" },
    ],
  },
  "byte-fox": {
    id: "byte-fox",
    species: "Byte Fox",
    domainSlug: "work",
    domainName: "Work & Projects",
    accentColor: "#3B82F6",
    badge: "Tier 3 Guardian",
    tagline: "Agile navigator of code, architecture, and complex product milestones.",
    evolutionStages: [
      { tier: 1, title: "Script Kit", xpThreshold: 0, unlockedForm: "Vulpine Sprite", perk: "Quick Start" },
      { tier: 2, title: "Byte Fox", xpThreshold: 2500, unlockedForm: "Cyber Kitsune", perk: "+20% Project Sprint XP" },
      { tier: 3, title: "Quantum Kitsune", xpThreshold: 7500, unlockedForm: "Singularity Form", perk: "Sub-50ms Flow Shield" },
    ],
  },
  "hydro-dragon": {
    id: "hydro-dragon",
    species: "Hydro Dragon",
    domainSlug: "learning",
    domainName: "Learning & Growth",
    accentColor: "#8B5CF6",
    badge: "Tier 2 Companion",
    tagline: "Fluid wisdom that absorbs technical concepts and deep literature like water.",
    evolutionStages: [
      { tier: 1, title: "Tide Wyrmling", xpThreshold: 0, unlockedForm: "Stream Serpent", perk: "Curiosity Spark" },
      { tier: 2, title: "Hydro Dragon", xpThreshold: 2000, unlockedForm: "Abyssal Leviathan", perk: "+25% Reading Retention" },
      { tier: 3, title: "Aether Leviathan", xpThreshold: 7000, unlockedForm: "Celestial Dragon", perk: "Mastery Cascade" },
    ],
  },
  "wisdom-owl": {
    id: "wisdom-owl",
    species: "Wisdom Owl",
    domainSlug: "volunteering",
    domainName: "Volunteering & Community",
    accentColor: "#F59E0B",
    badge: "Tier 2 Guardian",
    tagline: "Sharp perspective and unwavering devotion to team mentorship and community impact.",
    evolutionStages: [
      { tier: 1, title: "Fledgling Owl", xpThreshold: 0, unlockedForm: "Night Scout", perk: "Keen Vision" },
      { tier: 2, title: "Wisdom Owl", xpThreshold: 2000, unlockedForm: "Athene Sentinel", perk: "+10% Team Synergy XP" },
      { tier: 3, title: "Grand Athene", xpThreshold: 6000, unlockedForm: "All-Seeing Archon", perk: "Aura of Clarity" },
    ],
  },
  "aegis-turtle": {
    id: "aegis-turtle",
    species: "Aegis Turtle",
    domainSlug: "admin",
    domainName: "Home & Life Admin",
    accentColor: "#64748B",
    badge: "Tier 1 Guardian",
    tagline: "Immovable steadfastness ensuring domestic order, logistics, and quiet routine.",
    evolutionStages: [
      { tier: 1, title: "Aegis Turtle", xpThreshold: 0, unlockedForm: "Iron Shell", perk: "Routine Fortitude" },
      { tier: 2, title: "Titan Terrapin", xpThreshold: 3000, unlockedForm: "Bastion Shell", perk: "Streak Shield" },
    ],
  },
  "zenith-panther": {
    id: "zenith-panther",
    species: "Zenith Panther",
    domainSlug: "hobbies",
    domainName: "Hobbies & Fun",
    accentColor: "#EC4899",
    badge: "Tier 1 Companion",
    tagline: "Unbridled creative reflex and joyful mastery in play and creation.",
    evolutionStages: [
      { tier: 1, title: "Zenith Panther", xpThreshold: 0, unlockedForm: "Shadow Stalker", perk: "Flow State" },
      { tier: 2, title: "Apex Phantom", xpThreshold: 3000, unlockedForm: "Astral Stalker", perk: "Crit Yields" },
    ],
  },
};
