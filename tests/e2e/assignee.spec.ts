import { test, expect } from "@playwright/test";

/**
 * Tests for Assignee functionality in Multi-Task Project Kanban Board
 */
test.describe("Multi-Task Project Assignee", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    // Navigate to a multi-task project - find the "Pet Your Skills" project
    // Click on the project card in the sidebar or kanban board
    await page.getByRole("button", { name: /Pet Your Skills/i }).first().click();
    await expect(page).toHaveURL(/\/kanban\/.*/, { timeout: 10_000 });
  });

  test("should show assignee field when adding a new card", async ({ page }) => {
    // Click "Add a card" in TODO column
    await page.getByRole("button", { name: /Add a card/i }).first().click();

    // Check assignee input field exists
    await expect(page.getByPlaceholder("Assignee (optional)...")).toBeVisible();

    // Fill in assignee
    await page.getByPlaceholder("Assignee (optional)...").fill("Test Assignee");
    await page.getByPlaceholder("Task objective...").fill("Test Task with Assignee");

    // Click Add
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // Verify assignee appears on the card
    await expect(page.getByText("Test Assignee")).toBeVisible();
  });

  test("should edit assignee via task inspector", async ({ page }) => {
    // Click on an existing task to open inspector
    const taskCard = page.locator('[class*="bg-charcoal-surface"]').first();
    await taskCard.click();

    // Check assignee field in inspector
    await expect(page.getByPlaceholder("Enter assignee name...")).toBeVisible();

    // Fill in assignee
    await page.getByPlaceholder("Enter assignee name...").fill("Inspector Assignee");

    // Click Save
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify assignee appears on the card
    await expect(page.getByText("Inspector Assignee")).toBeVisible({ timeout: 5000 });
  });

  test("should persist assignee after page reload", async ({ page }) => {
    // Add a card with assignee
    await page.getByRole("button", { name: /Add a card/i }).first().click();
    await page.getByPlaceholder("Task objective...").fill("Persistent Task");
    await page.getByPlaceholder("Assignee (optional)...").fill("Persistent Assignee");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // Wait for card to appear
    await expect(page.getByText("Persistent Assignee")).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page).toHaveURL(/\/kanban\/.*/, { timeout: 10_000 });

    // Verify assignee still visible
    await expect(page.getByText("Persistent Assignee")).toBeVisible({ timeout: 10_000 });
  });

  test("should show user icon with assignee name on card", async ({ page }) => {
    // Add a card with assignee
    await page.getByRole("button", { name: /Add a card/i }).first().click();
    await page.getByPlaceholder("Task objective...").fill("Icon Test Task");
    await page.getByPlaceholder("Assignee (optional)...").fill("Icon Assignee");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // Check that User icon (svg) is present next to assignee name
    const assigneeText = page.getByText("Icon Assignee");
    await expect(assigneeText).toBeVisible();

    // The User icon should be a sibling element - check for the SVG
    const userIcon = assigneeText.locator("..").locator("svg").first();
    await expect(userIcon).toBeVisible();
  });

  test("should allow clearing assignee", async ({ page }) => {
    // First add a card with assignee
    await page.getByRole("button", { name: /Add a card/i }).first().click();
    await page.getByPlaceholder("Task objective...").fill("Clearable Task");
    await page.getByPlaceholder("Assignee (optional)...").fill("To Be Cleared");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(page.getByText("To Be Cleared")).toBeVisible();

    // Open inspector and clear assignee
    const taskCard = page.getByText("Clearable Task").locator("..");
    await taskCard.click();

    await page.getByPlaceholder("Enter assignee name...").clear();
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify assignee is gone from card
    await expect(page.getByText("To Be Cleared")).not.toBeVisible({ timeout: 5000 });
  });
});