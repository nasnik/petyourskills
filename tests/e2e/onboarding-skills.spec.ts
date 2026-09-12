import { test, expect } from "@playwright/test";
import { clickAndWaitForUrl } from "./utils";

test.describe("Onboarding Wizard - Multi-Skill Management", () => {
  test("allows adding multiple skills/projects under a domain on Step 3 and launching", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    // 1. Step 1: Select Domains
    await expect(
      page.getByRole("heading", { name: "Select Your Focus Domains" })
    ).toBeVisible();

    const initButton = page.getByRole("button", { name: "Initialize Core" });
    await expect(initButton).toBeVisible();
    await initButton.click();

    // 2. Step 2: Assign Companions
    await expect(
      page.getByRole("heading", { name: "Assign Your Skill Companions" })
    ).toBeVisible();

    const configureSkillsButton = page.getByRole("button", {
      name: "Configure Skills",
    });
    await expect(configureSkillsButton).toBeVisible();
    await configureSkillsButton.click();

    // 3. Step 3: Define Skills & Planning Engine
    await expect(
      page.getByRole("heading", { name: "Define Skills & Planning Engine" })
    ).toBeVisible();

    // Verify Add Skill button exists for Work & Projects
    const addWorkSkillBtn = page.getByRole("button", {
      name: "Add Skill / Project to Work & Projects",
    });
    await expect(addWorkSkillBtn).toBeVisible();

    // Click to add a second skill to Work
    await addWorkSkillBtn.click();

    // Expect second skill badge
    await expect(page.getByText("Skill / Project #2")).toBeVisible();

    // Multiple skills exist, so Remove button should be present
    const removeButtons = page.getByRole("button", { name: "Remove" });
    await expect(removeButtons.first()).toBeVisible();

    // Add a third skill and remove it to verify deletion
    await addWorkSkillBtn.click();
    await expect(page.getByText("Skill / Project #3")).toBeVisible();

    // Click the last remove button
    const removeCountBefore = await removeButtons.count();
    await removeButtons.last().click();

    // Verify third skill was removed and count decreased
    await expect(page.getByText("Skill / Project #3")).toHaveCount(0);
    await expect(page.getByText("Skill / Project #2")).toBeVisible();

    // Add a skill to Learning & Growth as well
    const addLearningSkillBtn = page.getByRole("button", {
      name: "Add Skill / Project to Learning & Growth",
    });
    await expect(addLearningSkillBtn).toBeVisible();
    await addLearningSkillBtn.click();

    // Step 3 allows launching to dashboard
    const launchBtn = page.getByRole("button", { name: "Launch Core System" });
    await expect(launchBtn).toBeVisible();
    await clickAndWaitForUrl(page, launchBtn, /\/dashboard$/, 30_000);

    // Verify landed on dashboard
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
