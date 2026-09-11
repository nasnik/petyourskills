# Pet Your Skills 🐾

**Gamified discipline & skill companions.** Turn habits, tasks, and focus sessions into XP that evolves digital companions across your life domains — and collaborate on shared project boards with nothing more than a passkey.

## Features

- **Skill companions** — every habit/skill is a pet that levels up and evolves through tiers as you earn XP.
- **Life domains** — Health & Wellness, Work & Projects, Learning & Growth, Volunteering/Admin, each with its own companion, XP track, and workspace.
- **Kanban boards** — personal task boards plus multi-task project boards (Backlog / In Progress / In Review / Done) with drag-and-drop.
- **Group projects via passkey** — share any project board with a passkey like `CYS-8941`; collaborators join at `/join` as **anonymous guests** scoped to that one board (they never see your other domains, habits, XP, or pets).
- **Guest → account upgrade** — guests can sign up later and keep the shared project alongside their new personal domains automatically.
- **Live board sync** — open boards poll the server every ~3s (drag-aware), so host and guests see each other's cards without refreshing.
- **Deep Focus timer** — full-screen focus sessions with server-verified XP.
- **Growth analytics** — weekly/monthly/yearly KPIs, completion rates, companion evolution.
- **Landing page + auth** — marketing page at `/`, email/password sign-in & sign-up, and project-passkey entry on both auth pages.

## Tech Stack

- **Next.js 16** (App Router, Server Actions) · **React 19** · **TypeScript**
- **Tailwind CSS 4** · **lucide-react** icons · **@hello-pangea/dnd** drag & drop
- **Prisma 7** + **Neon PostgreSQL** (app data)
- **Supabase Auth** (email/password sign-in/up; session bridged to the DB user via the `pys_uid` cookie)

## Getting Started

### 1. Install & configure

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | App URL (e.g. `http://localhost:3000`) |

> Demo mode: if Supabase vars are missing/placeholders, the app still runs with seeded demo data; without `DATABASE_URL` it falls back to bundled mock data.

### 2. Sync the database

```bash
npx prisma generate   # generate the client
npx prisma db push    # create/sync tables in Neon
npx tsx prisma/seed.ts  # optional: demo user, domains, board (passkey VANGUARD-8941)
```

### 3. Run

```bash
npm run dev    # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`.

## Testing

```bash
npm test           # Jest unit tests (passkey logic, XP/gamification engine)
npm run test:e2e   # Playwright E2E — boots its own demo-mode server on :3210
```

- **Unit (Jest)**: pure business logic — passcode derivation/normalization/matching
  (`src/lib/collaboration.test.ts`) and rank tiers + anti-exploit focus-session
  verification (`src/lib/gamification/xp-engine.test.ts`).
- **E2E (Playwright)**: landing/sign-in rendering, Instant Demo Entry → dashboard,
  the passkey join flow (invalid format, unknown passkey, `CYS-8941` guest join,
  scoped board access with personal routes hidden).
- E2E runs in **demo mode**: `scripts/e2e-server.js` launches the dev server with
  placeholder env vars, so tests never touch your real Neon/Supabase project — no
  credentials or seeded database needed. First run: `npx playwright install chromium`.

## Passkey Collaboration (Group Projects)

The sharing flow works end-to-end without the guest needing an account:

1. **Share** — on any multi-task project board, click **Share** to get the project's passkey (e.g. `CYS-8941`) and a direct invite link (`/join?code=...`). Passkeys are deterministic per project title, or a custom `passCode` set on a `KanbanBoard` row. Matching is case/separator-insensitive.
2. **Join** — the collaborator opens `/join`, enters the passkey, and an **anonymous guest account** is created (`User.isAnonymous = true`, `User.sharedProjectId` set, plus a `BoardMember` row for board-type projects).
3. **Scoped access** — the guest's dashboard/sidebar shows **only** the shared project. Personal routes and widgets are hidden; "add skill" attempts show an upgrade prompt instead.
4. **Upgrade** — if the guest signs up/in, their session merges: the shared project persists (via membership) next to their new personal domains.
5. **Live sync** — while a board is open, both sides poll `syncSharedProjectTasksAction` every 3s and merge changes; polling pauses during drags and hidden tabs.

Data-model notes:

- `Task.boardId` is a **polymorphic project reference** enforced at the application level (a `KanbanBoard` id, a MULTI_TASK root `Task` id, or a `SkillPet` id) — there is intentionally no DB foreign key on it.
- Pet/task "twins" with the same title+domain share one board identity; reads always union both ids.

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    join/                 # Passkey entry (guest onboarding)
    (auth)/               # sign-in, sign-up
    (onboarding)/         # Domain/companion setup
    (dashboard)/          # dashboard, calendar, growth, settings (guarded shell)
  actions/                # Server Actions
    auth.ts               # register/sync/upgrade (guest merge)
    collaboration.ts      # join / add shared card / live sync
    tasks.ts, focus.ts    # task & focus-session mutations
  components/             # UI (dashboard, kanban, layout, focus, growth, ...)
  lib/
    store/app-context.tsx # Client state (tasks, domains, modals, board sync)
    dashboard-seed.ts     # Per-request seed (user, guest-scoped, memberships)
    shared-project.ts     # Polymorphic project resolution (boards/tasks/pets)
    collaboration.ts      # Passcode helpers (shared client/server)
  types/                  # Shared TS models
prisma/
  schema.prisma           # User, LifeDomain, SkillPet, KanbanBoard, BoardMember, Task, FocusSession
  seed.ts                 # Demo data (board passkey: VANGUARD-8941)
_specs/                   # Product/architecture spec documents
```

## Deployment

Deploy to [Vercel](https://vercel.com/new) with the same environment variables. Run `npx prisma db push` against your production Neon database before (or right after) the first deploy.


