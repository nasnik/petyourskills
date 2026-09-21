import {
  AVATAR_EMOJIS,
  getDomainAvatarEmoji,
} from "./avatar-utils";

describe("AVATAR_EMOJIS", () => {
  it("maps every companion species to a real emoji (no '??' placeholders)", () => {
    for (const species of [
      "Vitality Wolf",
      "Byte Fox",
      "Wisdom Owl",
      "Hydro Dragon",
      "Aegis Turtle",
      "Zenith Panther",
      "Mystery Egg",
    ]) {
      expect(AVATAR_EMOJIS[species]).toBeTruthy();
      expect(AVATAR_EMOJIS[species]).not.toBe("??");
      expect(AVATAR_EMOJIS[species]).not.toBe("?");
    }
  });

  it("maps each species to its canonical emoji", () => {
    expect(AVATAR_EMOJIS["Vitality Wolf"]).toBe("🐺");
    expect(AVATAR_EMOJIS["Byte Fox"]).toBe("🦊");
    expect(AVATAR_EMOJIS["Wisdom Owl"]).toBe("🦉");
    expect(AVATAR_EMOJIS["Hydro Dragon"]).toBe("🐉");
    expect(AVATAR_EMOJIS["Aegis Turtle"]).toBe("🐢");
    expect(AVATAR_EMOJIS["Zenith Panther"]).toBe("🐆");
    expect(AVATAR_EMOJIS["Mystery Egg"]).toBe("🥚");
  });

  it("also maps kebab-case slugs used by the domain model", () => {
    expect(AVATAR_EMOJIS["vitality-wolf"]).toBe("🐺");
    expect(AVATAR_EMOJIS["mystery-egg"]).toBe("🥚");
  });
});

describe("getDomainAvatarEmoji", () => {
  it("resolves a species name to its emoji", () => {
    expect(getDomainAvatarEmoji("Wisdom Owl")).toBe("🦉");
    expect(getDomainAvatarEmoji("Mystery Egg")).toBe("🥚");
  });

  it("resolves a kebab-case species slug to its emoji", () => {
    expect(getDomainAvatarEmoji("byte-fox")).toBe("🦊");
  });

  it("resolves lowercase kebab-case species slugs to their emoji", () => {
    expect(getDomainAvatarEmoji("hydro-dragon")).toBe("🐉");
    expect(getDomainAvatarEmoji("wisdom-owl")).toBe("🦉");
  });

  it("returns the paw default when species is missing or unknown", () => {
    expect(getDomainAvatarEmoji()).toBe("🐾");
    expect(getDomainAvatarEmoji("")).toBe("🐾");
    expect(getDomainAvatarEmoji("Unicorn Spectre")).toBe("🐾");
  });
});
