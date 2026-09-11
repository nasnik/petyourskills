import { Locator, Page, expect } from "@playwright/test";

/**
 * Clicks a control and waits for the URL to change, retrying the click while
 * the control still exists and the URL hasn't changed.
 *
 * Handles two Next.js dev-mode realities:
 *  1. A click can land in the gap between first paint and client-side
 *     hydration, where no event handlers are attached yet (click is a no-op).
 *  2. Navigation triggered by async server actions can be slow (route
 *     compilation) — by the time a retry would fire, the control may already
 *     be gone, so we only re-click while the control is still visible.
 */
export async function clickAndWaitForUrl(
  page: Page,
  locator: Locator,
  url: RegExp,
  timeout = 30_000
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    // Re-click only while the control still exists (i.e. we haven't navigated)
    if (await locator.isVisible().catch(() => false)) {
      await locator.click().catch(() => {});
    }
    if (
      await page
        .waitForURL(url, { timeout: 3_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      return;
    }
  }
  await expect(page).toHaveURL(url, { timeout: 5_000 });
}

/**
 * Clicks a button and waits for an element (e.g. a validation error) to
 * appear, retrying the click while both are absent — see
 * clickAndWaitForUrl for why retries are needed in dev mode.
 */
export async function clickUntilTextVisible(
  locator: Locator,
  textLocator: Locator,
  timeout = 15_000
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await locator.isVisible().catch(() => false)) {
      await locator.click().catch(() => {});
    }
    if (
      await textLocator
        .waitFor({ timeout: 3_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      return;
    }
  }
  await textLocator.waitFor({ timeout: 5_000 });
}