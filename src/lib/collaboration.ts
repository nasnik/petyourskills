/**
 * Shared helpers for passkey-based project collaboration.
 * Pure functions — safe to import from client components, server components,
 * and server actions alike.
 */

export const PYS_GUEST_NAME_COOKIE = "pys_guest_name";
export const PYS_GUEST_AVATAR_COOKIE = "pys_guest_avatar";


/**
 * Derives the deterministic, memorable passcode for a project title.
 * e.g. "CYS" -> "CYS-8941", "Pet Your Skills" -> "PETY-8941"
 */
export function computeProjectPassCode(title: string): string {
  const cleanPrefix =
    title
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase() || "PROJ";
  return `${cleanPrefix}-8941`;
}

/**
 * Normalizes a user-typed passcode so "cys 8941", "cys-8941" and "CYS-8941"
 * all compare equal (separator- and case-insensitive).
 */
export function normalizePassCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s\-_]+/g, "");
}

/** Loose format check: 3-16 alphanumeric chars after stripping separators. */
export function isValidPassCodeFormat(input: string): boolean {
  return /^[A-Z0-9]{3,16}$/.test(normalizePassCode(input));
}

/** True when a stored/computed passcode matches user input. */
export function passCodesMatch(
  stored: string | null | undefined,
  input: string
): boolean {
  if (!stored) return false;
  return normalizePassCode(stored) === normalizePassCode(input);
}
