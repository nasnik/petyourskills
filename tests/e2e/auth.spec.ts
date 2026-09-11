import { test, expect } from "@playwright/test";
import { clickAndWaitForUrl } from "./utils";

/**
 * Authentication flows — sign-in page rendering and the seeded demo account.
 * Runs in demo mode (no Supabase credentials): auth calls fail gracefully
 * and the app falls back to the seeded Commander account.
 */
test.describe("Sign-in page", () => {
  test("renders the sign-in form with email/password fields", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByRole("heading", { name: "Sign In to Pet Your Skills" })
    ).toBeVisible();

    const email = page.locator('input[type="email"]');
    await expect(email).toBeVisible();

    const password = page.locator('input[type="password"]');
    await expect(password).toBeVisible();

    // Quick demo entry shortcut is offered
    await expect(
      page.getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" })
    ).toBeVisible();
  });

  test("passkey shortcut navigates to the shared-project join page", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: "Passkey — join a shared project" }),
      /\/join$/
    );

    await expect(
      page.getByRole("heading", { name: "Join Shared Project" })
    ).toBeVisible();
  });
});

test.describe("Instant Demo Entry", () => {
  test("signs in the seeded Commander and lands on the dashboard", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: "Instant Demo Entry (Seeded Commander)" }),
      /\/dashboard$/,
      20_000
    );

    // exact: the seeded work board has a "Complete Dashboard Wireframe" task
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true })
    ).toBeVisible();

    // Seeded profile is rendered in the header pill
    await expect(page.getByText("Anastasia Nikulina")).toBeVisible();
  });
});