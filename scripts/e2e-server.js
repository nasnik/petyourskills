/**
 * Dev-server launcher for Playwright E2E tests. Forces demo mode so tests are
 * hermetic — they never touch the real Neon DB or Supabase project.
 *
 * How it works:
 *  - @next/env never applies .env values to variables already present in
 *    process.env, so pre-setting them here overrides the local .env.
 *  - DATABASE_URL points at 127.0.0.1:1 (connection refused instantly).
 *    Prisma 7 REQUIRES a driver adapter, so it cannot be empty (construction
 *    would throw); instead every query rejects fast, the app's catch blocks
 *    kick in, and it falls back to bundled mock data (src/lib/mock-data.ts).
 *  - Supabase vars are emptied: middleware passes requests straight through
 *    and the supabase clients no-op with placeholder values.
 */
process.env.DATABASE_URL =
  "postgresql://e2e:e2e@127.0.0.1:1/e2e?connect_timeout=1";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
process.env.PYS_E2E_DEMO_MODE = "1";

const port = process.argv[2] || "3210";
process.argv = [
  process.argv[0],
  "next",
  "dev",
  "--port",
  port,
];

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS wrapper: pre-sets env before requiring the next CLI (ESM import would hoist and run next before the env vars are set)
require("next/dist/bin/next");