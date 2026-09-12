import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration. The webServer block auto-starts the Next.js dev server
 * and waits for it to be ready before running tests, so `npm run test:e2e`
 * works with zero manual setup.
 *
 * Tests run in demo mode: no DATABASE_URL / Supabase credentials required —
 * the app falls back to bundled mock data (see src/lib/mock-data.ts).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  // Sequential execution: one dev server compiles routes on demand, and
  // parallel first-hits make compile times unpredictable. 10 tests run in
  // about a minute — determinism beats raw speed for a portfolio project.
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3210",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.NO_SERVER
    ? undefined
    : {
        // Demo-mode launcher: pre-sets env vars as empty so the app falls back to
        // bundled mock data — tests never touch the real Neon DB or Supabase.
        // Dedicated port 3210 avoids clashing with a normal `npm run dev` server.
        command: "node scripts/e2e-server.js 3210",
        url: "http://localhost:3210",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});