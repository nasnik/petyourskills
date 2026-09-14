import { test, expect } from "@playwright/test";

/**
 * Dashboard and Kanban board flows for the seeded demo account
 * ("Instant Demo Entry"). Demo mode uses bundled mock data, so all
 * assertions below run against the known seeded dataset.
 */
test.describe("Demo dashboard", () => {
  test("renders core widgets and navigation after demo sign-in", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" })
      .click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    // exact: the seeded work board has a "Complete Dashboard Wireframe" task
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true })
    ).toBeVisible();

    // Personal dashboard widgets
    await expect(page.getByText("Quick Log Action")).toBeVisible();
    await expect(page.getByText("Daily Completion")).toBeVisible();

    // Sidebar exposes the seeded life domains (multiple matches on the page —
    // domain accordion, quest cards, pet labels — so use .first())
    await expect(page.getByText("Life Domains & Companions")).toBeVisible();
    await expect(page.getByText("Health & Wellness").first()).toBeVisible();
    await expect(page.getByText("Work & Projects").first()).toBeVisible();

    // Host vs guest: the demo commander is NOT flagged as a guest
    await expect(page.getByText("GUEST", { exact: true })).toHaveCount(0);
  });
});

test.describe("Landing page", () => {
  test("renders marketing content and links to auth pages", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /start raising your companions today/i })
    ).toBeVisible();

    // Footer links offer both auth paths and passkey entry (multiple matches
    // for Sign In/Up exist on the page — use .first() to avoid strict-mode errors)
    await expect(
      page.getByRole("link", { name: "Sign In" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign Up" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Join with Passkey" })
    ).toBeVisible();
  });
});