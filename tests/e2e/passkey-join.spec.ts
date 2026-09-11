import { test, expect } from "@playwright/test";
import { clickAndWaitForUrl, clickUntilTextVisible } from "./utils";

/**
 * Passkey-based shared-project join flow — the app's core collaboration
 * feature. Runs in demo mode (no database): the join server action falls
 * back to bundled mock data, where pet "CYS" (dom-volunteering) is a
 * MULTI_TASK project joinable via passkey CYS-8941.
 */
test.describe("Join page", () => {
  test("renders the passkey form and pre-fills ?code= from the URL", async ({
    page,
  }) => {
    await page.goto("/join?code=CYS-8941");

    await expect(
      page.getByRole("heading", { name: "Join Shared Project" })
    ).toBeVisible();
    await expect(page.locator("#passcode")).toHaveValue("CYS-8941");
  });

  test("rejects malformed passkeys client-side", async ({ page }) => {
    await page.goto("/join");

    await page.locator("#passcode").fill("AB");
    await clickUntilTextVisible(
      page.getByRole("button", { name: "Enter Project Workspace" }),
      page.getByText("Enter a valid project passkey (e.g. CYS-8941).")
    );

    // Still on the join page — no navigation happened
    await expect(page).toHaveURL(/\/join/);
  });

  test("rejects unknown passkeys with a friendly error", async ({ page }) => {
    await page.goto("/join");

    await page.locator("#passcode").fill("ZZZZ-8941");
    await clickUntilTextVisible(
      page.getByRole("button", { name: "Enter Project Workspace" }),
      page.getByText(/No shared project matches this passkey/)
    );
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Passkey join flow (demo mode)", () => {
  test("guest joins the CYS project and lands on its scoped board", async ({
    page,
  }) => {
    await page.goto("/join");

    // Loose input is normalized — cys 8941 === CYS-8941
    await page.locator("#passcode").fill("cys 8941");
    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: "Enter Project Workspace" }),
      /\/dashboard$/,
      20_000
    );

    // Guest session markers
    await expect(page.getByText("GUEST", { exact: true })).toBeVisible();
    await expect(page.getByText("Guest Collaborator").first()).toBeVisible();

    // Scoped access: the sidebar shows ONE shared project, not the host's
    // four personal life domains (exact: other texts mention "shared project")
    await expect(
      page.getByText("Shared Project", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Health & Wellness", { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByText("Learning & Growth", { exact: true })
    ).toHaveCount(0);

    // Fresh guest sessions auto-open the shared project board
    await expect(page.getByText("TO DO", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("IN PROGRESS", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("IN REVIEW", { exact: true }).first()
    ).toBeVisible();

    // Seeded CYS cards from mock data
    await expect(
      page.getByText("Youth Mentorship Workshop Planning")
    ).toBeVisible();
    await expect(
      page.getByText("Volunteer Registration & Logistics")
    ).toBeVisible();
    await expect(
      page.getByText("Community Outreach & Sponsor Deck")
    ).toBeVisible();
  });

  test("guest board shows the DONE column and keeps personal routes hidden", async ({
    page,
  }) => {
    await page.goto("/join?code=CYS-8941");
    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: "Enter Project Workspace" }),
      /\/dashboard$/,
      20_000
    );

    // Full 4-column board
    await expect(page.getByText("DONE", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Guest nav is scoped: personal routes are absent
    await expect(
      page.getByRole("link", { name: "Growth Analytics" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Schedule" })
    ).toHaveCount(0);

    // Upgrade path is offered instead
    await expect(
      page.getByRole("link", { name: "Create Full Account" })
    ).toBeVisible();
  });
});