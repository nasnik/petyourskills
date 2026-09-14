import { test, expect } from "@playwright/test";

/**
 * Tests for dashboard quest features:
 * - Checkboxes and avatars on quests in sidebar
 * - Checkboxes and avatars on quests in dashboard
 * - Companions with XP in dashboard header
 * - Daily Completion widget
 * - Quests list
 */
test.describe("Dashboard Quest Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  });

  test.describe("Sidebar quests", () => {
    test("should have checkboxes on all quests", async ({ page }) => {
      await expect(page.getByText("Today's Focus & Habits")).toBeVisible();
      const checkboxes = page.locator('aside [role="checkbox"]');
      await expect(checkboxes.first()).toBeVisible();
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have avatars on all quests", async ({ page }) => {
      const questItems = page.locator('aside [class*="group"]').filter({ hasText: "XP" });
      await expect(questItems.first()).toBeVisible();
      const questText = await questItems.first().textContent();
      const avatarEmojis = ["🐺", "🦊", "🐉", "🦉", "🐢", "🐆", "🥚"];
      const hasAvatar = avatarEmojis.some(emoji => questText?.includes(emoji));
      expect(hasAvatar).toBeTruthy();
    });

    test("should have avatars on multi-task projects", async ({ page }) => {
      await expect(page.getByText("Multi-Task Projects")).toBeVisible();
      const projectItems = page.locator('aside [class*="cursor-pointer"]').filter({ hasText: "Kanban" });
      await expect(projectItems.first()).toBeVisible();
      const projectText = await projectItems.first().textContent();
      const avatarEmojis = ["🐺", "🦊", "🐉", "🦉", "🐢", "🐆", "🥚"];
      const hasAvatar = avatarEmojis.some(emoji => projectText?.includes(emoji));
      expect(hasAvatar).toBeTruthy();
    });
  });

  test.describe("Dashboard quests", () => {
    test("should have checkboxes on all quests", async ({ page }) => {
      await expect(page.getByText("Today's Quests")).toBeVisible();
      const checkboxes = page.locator('main [role="checkbox"]');
      await expect(checkboxes.first()).toBeVisible();
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have avatars on all quests", async ({ page }) => {
      const questCards = page.locator('main [class*="cursor-pointer"]').filter({ hasText: "XP" });
      await expect(questCards.first()).toBeVisible();
      const questText = await questCards.first().textContent();
      const avatarEmojis = ["🐺", "🦊", "🐉", "🦉", "🐢", "🐆", "🥚"];
      const hasAvatar = avatarEmojis.some(emoji => questText?.includes(emoji));
      expect(hasAvatar).toBeTruthy();
    });
  });

  test.describe("Dashboard header companions", () => {
    test("should show companion avatars in header", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      const header = page.locator('[class*="flex-col"]').first();
      const headerText = await header.textContent();
      const avatarEmojis = ["🐺", "🦊", "🐉", "🦉", "🐢", "🐆", "🥚"];
      const hasAvatar = avatarEmojis.some(emoji => headerText?.includes(emoji));
      expect(hasAvatar).toBeTruthy();
    });
  });

  test.describe("Daily Completion widget", () => {
    test("should be visible on dashboard", async ({ page }) => {
      await expect(page.getByText("Daily Completion")).toBeVisible();
    });

    test("should show category completion stats", async ({ page }) => {
      await expect(page.getByText("Daily Routines")).toBeVisible();
    });
  });

  test.describe("Quests list", () => {
    test("should be visible on dashboard", async ({ page }) => {
      await expect(page.getByText("Today's Quests")).toBeVisible();
    });

    test("should show filter pills (All, Pending, Completed)", async ({ page }) => {
      await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /Pending/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();
    });

    test("should show Add Quest button", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Add Quest" })).toBeVisible();
    });

    test("should display quests with title and XP", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Morning 5km Run" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Code Review" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "NodeJS Architecture Review" })).toBeVisible();

      const main = page.locator('main');
      await expect(main.getByText("+150 XP")).toBeVisible();
      await expect(main.getByText("+120 XP")).toBeVisible();
      await expect(main.getByText("+200 XP")).toBeVisible();
    });
  });
});