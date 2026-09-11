import {
  computeProjectPassCode,
  isValidPassCodeFormat,
  normalizePassCode,
  passCodesMatch,
} from "./collaboration";

describe("computeProjectPassCode", () => {
  it("derives the deterministic passcode from the first 4 alphanumeric chars", () => {
    expect(computeProjectPassCode("CYS")).toBe("CYS-8941");
  });

  it("keeps only the first 4 characters of longer titles", () => {
    expect(computeProjectPassCode("Pet Your Skills")).toBe("PETY-8941");
  });

  it("strips non-alphanumeric characters before truncating", () => {
    expect(computeProjectPassCode("GitHub course")).toBe("GITH-8941");
  });

  it("falls back to PROJ for empty or symbol-only titles", () => {
    expect(computeProjectPassCode("")).toBe("PROJ-8941");
    expect(computeProjectPassCode("---")).toBe("PROJ-8941");
  });

  it("uppercases lowercase input", () => {
    expect(computeProjectPassCode("nodejs course")).toBe("NODE-8941");
  });
});

describe("normalizePassCode", () => {
  it("uppercases and trims", () => {
    expect(normalizePassCode("  cys 8941 ")).toBe("CYS8941");
  });

  it("removes separator variants (space, dash, underscore)", () => {
    expect(normalizePassCode("cys-8941")).toBe("CYS8941");
    expect(normalizePassCode("cys_8941")).toBe("CYS8941");
    expect(normalizePassCode("CYS 8941")).toBe("CYS8941");
  });

  it("collapses repeated separators", () => {
    expect(normalizePassCode("cys--  __8941")).toBe("CYS8941");
  });
});

describe("isValidPassCodeFormat", () => {
  it("accepts well-formed codes in any separator style", () => {
    expect(isValidPassCodeFormat("CYS-8941")).toBe(true);
    expect(isValidPassCodeFormat("cys 8941")).toBe(true);
    expect(isValidPassCodeFormat("CYS8941")).toBe(true);
  });

  it("rejects codes shorter than 3 characters after normalization", () => {
    expect(isValidPassCodeFormat("AB")).toBe(false);
    expect(isValidPassCodeFormat("-")).toBe(false);
  });

  it("rejects codes longer than 16 characters after normalization", () => {
    expect(isValidPassCodeFormat("A".repeat(17))).toBe(false);
  });

  it("rejects non-alphanumeric characters other than separators", () => {
    expect(isValidPassCodeFormat("CYS-8941!")).toBe(false);
    expect(isValidPassCodeFormat("cys/8941")).toBe(false);
  });
});

describe("passCodesMatch", () => {
  it("matches stored codes against loosely typed user input", () => {
    expect(passCodesMatch("CYS-8941", "cys 8941")).toBe(true);
    expect(passCodesMatch("PETY-8941", "pety_8941")).toBe(true);
    expect(passCodesMatch("GITH-8941", "GITH8941")).toBe(true);
  });

  it("rejects genuinely different codes", () => {
    expect(passCodesMatch("CYS-8941", "PETY-8941")).toBe(false);
  });

  it("never matches when no code is stored", () => {
    expect(passCodesMatch(null, "CYS-8941")).toBe(false);
    expect(passCodesMatch(undefined, "CYS-8941")).toBe(false);
    expect(passCodesMatch("", "CYS-8941")).toBe(false);
  });
});
