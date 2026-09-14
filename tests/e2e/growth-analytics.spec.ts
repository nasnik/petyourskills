import { test, expect } from "@playwright/test";

/**
 * Tests for Growth Analytics page
 * - Timeframe switching (Day/Week/Month/Year)
 * - KPI metrics update with timeframe
 * - Focus Hours Chart renders with data
 * - Domain Progress List shows domain stats
 * - Companion Evolution shows active companion
 * - Project Time Stats shows breakdown
 */
test.describe("Growth Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    // Navigate to Growth page
    await page.getByRole("link", { name: "Growth Analytics" }).click();
    await expect(page).toHaveURL(/\/growth$/, { timeout: 10_000 });
  });

  test("should load Growth Analytics page with correct title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Growth & Accomplishments", exact: true })).toBeVisible();
    await expect(page.getByText("SYNCED")).toBeVisible();
  });

  test("should show timeframe filter pills", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Day", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Week", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Month", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Year", exact: true })).toBeVisible();
  });

  test("should have Week selected by default", async ({ page }) => {
    const weekButton = page.getByRole("button", { name: "Week", exact: true });
    await expect(weekButton).toHaveClass(/bg-wellness-emerald/);
  });

  test.describe("KPI Metrics", () => {
    test("should show Total Focus Time metric", async ({ page }) => {
      await expect(page.getByText("TOTAL FOCUS TIME")).toBeVisible();
      // Should show some time format
      await expect(page.locator('text=/\\d+h/').first()).toBeVisible();
    });

    test("should show Tasks Accomplished metric", async ({ page }) => {
      await expect(page.getByText("TASKS ACCOMPLISHED")).toBeVisible();
      await expect(page.getByText(/Completed/)).toBeVisible();
    });

    test("should show XP Generated metric", async ({ page }) => {
      await expect(page.getByText("XP GENERATED")).toBeVisible();
      // XP value in the metric card - target the card specifically
      const xpCard = page.getByText("XP GENERATED").locator("..").locator("..");
      await expect(xpCard.getByText(/\+[\d,]+ XP/)).toBeVisible();
    });

    test("should show Current Streak metric", async ({ page }) => {
      await expect(page.getByText("CURRENT STREAK")).toBeVisible();
      await expect(page.getByText(/Days Active/)).toBeVisible();
    });
  });

  test.describe("Timeframe Switching", () => {
    test("should update when switching to Day", async ({ page }) => {
      await page.getByRole("button", { name: "Day", exact: true }).click();
      await expect(page.getByRole("button", { name: "Day", exact: true })).toHaveClass(/bg-wellness-emerald/);
      await expect(page.getByText("TOTAL FOCUS TIME")).toBeVisible();
    });

    test("should update when switching to Month", async ({ page }) => {
      await page.getByRole("button", { name: "Month", exact: true }).click();
      await expect(page.getByRole("button", { name: "Month", exact: true })).toHaveClass(/bg-wellness-emerald/);
      await expect(page.getByText("TOTAL FOCUS TIME")).toBeVisible();
      await expect(page.getByText("TASKS ACCOMPLISHED")).toBeVisible();
      await expect(page.getByText("XP GENERATED")).toBeVisible();
      await expect(page.getByText("CURRENT STREAK")).toBeVisible();
    });

    test("should update when switching to Year", async ({ page }) => {
      await page.getByRole("button", { name: "Year", exact: true }).click();
      await expect(page.getByRole("button", { name: "Year", exact: true })).toHaveClass(/bg-wellness-emerald/);
      await expect(page.getByText("TOTAL FOCUS TIME")).toBeVisible();
    });

    test("should switch back to Week", async ({ page }) => {
      await page.getByRole("button", { name: "Day", exact: true }).click();
      await page.getByRole("button", { name: "Week", exact: true }).click();
      await expect(page.getByRole("button", { name: "Week", exact: true })).toHaveClass(/bg-wellness-emerald/);
    });
  });

  test.describe("Focus Hours Chart", () => {
    test("should render chart section", async ({ page }) => {
      await expect(page.getByText("Daily Domain Focus Hours")).toBeVisible();
      // Chart canvas should exist
      await expect(page.locator('.h-56')).toBeVisible();
    });

    test("should show day labels", async ({ page }) => {
      // Day labels should be present (exact match to avoid matching "Month" button)
      await expect(page.getByText("Mon", { exact: true })).toBeVisible();
      await expect(page.getByText("Tue", { exact: true })).toBeVisible();
      await expect(page.getByText("Wed", { exact: true })).toBeVisible();
    });

    test("should update chart when timeframe changes", async ({ page }) => {
      await page.getByRole("button", { name: "Day", exact: true }).click();
      await expect(page.getByText("Daily Domain Focus Hours")).toBeVisible();

      await page.getByRole("button", { name: "Month", exact: true }).click();
      await expect(page.getByText("Daily Domain Focus Hours")).toBeVisible();
    });
  });

  test.describe("Domain Progress List", () => {
    test("should show domain progress section", async ({ page }) => {
      await expect(page.getByText("Domain Goal Progress & Yield")).toBeVisible();
    });

    test("should update when timeframe changes", async ({ page }) => {
      await page.getByRole("button", { name: "Day", exact: true }).click();
      await expect(page.getByText("Domain Goal Progress & Yield")).toBeVisible();

      await page.getByRole("button", { name: "Month", exact: true }).click();
      await expect(page.getByText("Domain Goal Progress & Yield")).toBeVisible();
    });
  });

  test.describe("Companion Evolution", () => {
    test("should show companion evolution section", async ({ page }) => {
      await expect(page.getByText("Companion Evolution")).toBeVisible();
      await expect(page.getByText("Active Slot")).toBeVisible();
    });

    test("should show evolution progress for companions", async ({ page }) => {
      // Multiple "Evolution Progress" labels exist (one per companion), check first one
      await expect(page.getByText("Evolution Progress").first()).toBeVisible();
    });

    test("should show active domain perks", async ({ page }) => {
      await expect(page.getByText("Active Domain Perks")).toBeVisible();
      await expect(page.getByText("Endurance Buff")).toBeVisible();
      await expect(page.getByText("Recovery Pulse")).toBeVisible();
    });

    test("should show other companions section when multiple exist", async ({ page }) => {
      await expect(page.getByText("Other Companions")).toBeVisible();
    });
  });

  test.describe("Project Time Stats", () => {
    test("should show project breakdown section", async ({ page }) => {
      await expect(page.getByText("Project & Skill Time Breakdown")).toBeVisible();
    });

    test("should update when timeframe changes", async ({ page }) => {
      await page.getByRole("button", { name: "Day", exact: true }).click();
      await expect(page.getByText("Project & Skill Time Breakdown")).toBeVisible();

      await page.getByRole("button", { name: "Month", exact: true }).click();
      await expect(page.getByText("Project & Skill Time Breakdown")).toBeVisible();
    });
  });

  test.describe("Data Consistency", () => {
    test("should have all main sections rendered", async ({ page }) => {
      // All components should render without errors
      await expect(page.getByText("Daily Domain Focus Hours")).toBeVisible();
      await expect(page.getByText("Domain Goal Progress & Yield")).toBeVisible();
      await expect(page.getByText("Companion Evolution")).toBeVisible();
      await expect(page.getByText("Project & Skill Time Breakdown")).toBeVisible();
    });

    test("should show KPI cards", async ({ page }) => {
      // All 4 KPI cards should be present
      await expect(page.getByText("TOTAL FOCUS TIME")).toBeVisible();
      await expect(page.getByText("TASKS ACCOMPLISHED")).toBeVisible();
      await expect(page.getByText("XP GENERATED")).toBeVisible();
      await expect(page.getByText("CURRENT STREAK")).toBeVisible();
    });
  });
});