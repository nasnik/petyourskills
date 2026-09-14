export const AVATAR_EMOJIS: Record<string, string> = {
  "Vitality Wolf": "🐺",
  "Byte Fox": "🦊",
  "Wisdom Owl": "🦉",
  "Hydro Dragon": "🐉",
  "Aegis Turtle": "🐢",
  "Zenith Panther": "🐆",
  "Mystery Egg": "🥚",
  "vitality-wolf": "🐺",
  "byte-fox": "🦊",
  "wisdom-owl": "🦉",
  "hydro-dragon": "🐉",
  "aegis-turtle": "🐢",
  "zenith-panther": "🐆",
  "mystery-egg": "🥚",
};

export function getDomainAvatarEmoji(avatarSpecies?: string): string {
  if (!avatarSpecies) return "🐾";
  return AVATAR_EMOJIS[avatarSpecies] || AVATAR_EMOJIS[avatarSpecies.toLowerCase()] || "🐾";
}