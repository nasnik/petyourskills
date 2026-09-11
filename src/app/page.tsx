import React from "react";
import Link from "next/link";
import {
  Sparkles,
  PawPrint,
  Layers,
  Users,
  KeyRound,
  Clock,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { getPysUidFromCookie } from "@/actions/auth";

const ADVANTAGES = [
  {
    icon: PawPrint,
    title: "Skill Companions That Evolve",
    desc: "Every habit becomes a digital companion. Log actions, earn XP, and watch your pets level up and evolve through tiers — discipline you can actually see.",
    accent: "#10B981",
  },
  {
    icon: Layers,
    title: "All Life Domains in One Place",
    desc: "Health & Wellness, Work & Projects, Learning & Growth, Volunteering — each domain gets its own companion, XP track, and focused Kanban workspace.",
    accent: "#3B82F6",
  },
  {
    icon: Users,
    title: "Group Projects via Passkey",
    desc: "Invite collaborators to a project board with a simple passkey. They join instantly as anonymous guests — no account required, no setup friction.",
    accent: "#8B5CF6",
  },
  {
    icon: ShieldCheck,
    title: "Scoped, Privacy-First Access",
    desc: "Guests only ever see the shared project board. Your other domains, habits, XP, and companions stay completely private — guaranteed by design.",
    accent: "#F59E0B",
  },
  {
    icon: Clock,
    title: "Deep Focus Sessions",
    desc: "Launch a full-screen focus timer on any task. Completed sessions are verified and converted into XP for you and your companion automatically.",
    accent: "#EC4899",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    desc: "Weekly, monthly, and yearly KPIs across every domain. Track completion rates, focus hours, and companion evolution over time.",
    accent: "#06B6D4",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Pick your domains & companions",
    desc: "Choose the life areas you want to master and assign each one a base companion species to raise.",
  },
  {
    num: "02",
    title: "Log habits, tasks & focus time",
    desc: "Complete quests, move cards across your Kanban boards, and run deep focus sessions — every action earns XP.",
  },
  {
    num: "03",
    title: "Evolve & collaborate",
    desc: "Watch companions grow through evolution tiers, and share any project with a passkey to work together live.",
  },
];

export default async function LandingPage() {
  // Returning users jump straight back into their dashboard
  const existingUid = await getPysUidFromCookie().catch(() => null);
  const primaryCta = existingUid
    ? { href: "/dashboard", label: "Open Dashboard" }
    : { href: "/sign-up", label: "Create Free Account" };

  return (
    <div className="min-h-screen w-full bg-obsidian-deep text-on-surface flex flex-col relative overflow-x-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full bg-wellness-emerald/10 blur-[140px]" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <Sparkles size={17} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Pet Your Skills
          </span>
          <span className="text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            v2.4.0
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="h-9 px-4 rounded border border-white/10 text-xs font-mono text-on-surface-variant hover:text-white hover:bg-white/5 flex items-center transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={primaryCta.href}
            className="h-9 px-4 rounded bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep text-xs font-mono font-bold uppercase tracking-wider flex items-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {existingUid ? "Dashboard" : "Get Started"}
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-wellness-emerald/10 border border-wellness-emerald/30 text-[11px] font-mono text-wellness-emerald mb-5">
            <Zap size={12} className="fill-wellness-emerald" />
            <span>GAMIFIED DISCIPLINE OS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08] font-hanken">
            Train your skills.
            <br />
            <span className="text-wellness-emerald">Raise your companions.</span>
          </h1>

          <p className="text-sm text-on-surface-variant leading-relaxed mt-5 max-w-lg">
            Pet Your Skills turns habits, tasks, and focus sessions into XP
            that evolves digital companions across your life domains. Plan
            work on Kanban boards, share any project with a passkey, and
            collaborate live — without giving up an ounce of privacy.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              href={primaryCta.href}
              className="h-11 px-6 rounded-lg bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.98]"
            >
              <span>{primaryCta.label}</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/sign-in"
              className="h-11 px-6 rounded-lg border border-white/15 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
          </div>

          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-mono text-wellness-emerald hover:underline"
          >
            <KeyRound size={13} />
            <span>Have a project passkey? Join a shared workspace →</span>
          </Link>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-8 text-[11px] font-mono text-outline">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-wellness-emerald" />
              Free to start
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-wellness-emerald" />
              Anonymous guest access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-wellness-emerald" />
              Live board sync
            </span>
          </div>
        </div>

        {/* CSS-only app preview */}
        <div className="relative">
          <div className="absolute -inset-4 bg-wellness-emerald/10 blur-2xl rounded-3xl pointer-events-none" />
          <div className="relative bg-charcoal-surface border border-white/10 rounded-2xl p-4 shadow-2xl">
            {/* Window bar */}
            <div className="flex items-center gap-1.5 pb-3 border-b border-white/10 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[10px] font-mono text-outline">
                petyourskills.app/dashboard
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Companion card */}
              <div className="col-span-3 sm:col-span-1 bg-obsidian-deep border border-white/10 rounded-xl p-3.5">
                <div className="text-[9px] font-mono uppercase tracking-wider text-outline mb-2">
                  Active Companion
                </div>
                <div className="text-4xl mb-2">🐺</div>
                <div className="text-xs font-bold text-white">Vitality Wolf</div>
                <div className="text-[10px] font-mono text-wellness-emerald mb-2">
                  LVL 15 · Tier II
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-wellness-emerald rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-outline mt-1">
                  <span>XP</span>
                  <span>3,400 / 4,000</span>
                </div>
              </div>

              {/* Kanban preview */}
              <div className="col-span-3 sm:col-span-2 grid grid-cols-3 gap-2">
                {[
                  { label: "TO DO", dot: "#64748B", cards: ["Morning 5km run", "Read 20 pages"] },
                  { label: "DOING", dot: "#3B82F6", cards: ["Kanban v2 design"] },
                  { label: "DONE", dot: "#10B981", cards: ["Focus 45m ✓", "Mentor call ✓"] },
                ].map((col) => (
                  <div
                    key={col.label}
                    className="bg-obsidian-deep/80 border border-white/10 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: col.dot, boxShadow: `0 0 6px ${col.dot}` }}
                      />
                      <span className="text-[8px] font-mono font-bold text-outline">
                        {col.label}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {col.cards.map((c) => (
                        <div
                          key={c}
                          className="bg-charcoal-surface border border-white/10 rounded p-1.5 text-[9px] text-white/90 leading-tight"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared badge */}
            <div className="mt-3 flex items-center justify-between bg-wellness-emerald/10 border border-wellness-emerald/30 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono text-wellness-emerald flex items-center gap-1.5">
                <Users size={12} />
                Shared with 2 guest collaborators
              </span>
              <span className="text-[9px] font-mono text-outline">CYS-8941</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Advantages ──────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-wellness-emerald mb-2">
            Why Pet Your Skills
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-hanken">
            Discipline, engineered to be addictive
          </h2>
          <p className="text-sm text-outline mt-2 max-w-xl mx-auto">
            Six reasons builders, students, and teams raise their skills with us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADVANTAGES.map((f) => (
            <div
              key={f.title}
              className="group bg-charcoal-surface/80 border border-white/10 rounded-xl p-5 hover:border-white/25 transition-all hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 border transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${f.accent}18`,
                  borderColor: `${f.accent}45`,
                  color: f.accent,
                  boxShadow: `0 0 18px ${f.accent}25`,
                }}
              >
                <f.icon size={19} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-wellness-emerald mb-2">
            How It Works
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-hanken">
            Three steps to your first evolution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="relative bg-obsidian-deep/60 border border-white/10 rounded-xl p-6"
            >
              <div className="text-3xl font-bold font-mono text-wellness-emerald/40 mb-3">
                {s.num}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ── Passkey spotlight ───────────────────────────────── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-14">
        <div className="bg-charcoal-surface border border-wellness-emerald/25 rounded-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-wellness-emerald to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-wellness-emerald mb-3">
                <KeyRound size={18} />
                <span className="text-[11px] font-mono uppercase tracking-[0.25em]">
                  Zero-Friction Collaboration
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-hanken mb-3">
                Share a project with one passkey
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Open any project board, hit <span className="text-white font-semibold">Share</span>,
                and send the passkey to your teammates. They join in seconds as
                anonymous collaborators with access to{" "}
                <span className="text-white font-semibold">only that board</span> —
                cards sync live for everyone. If they later create an account,
                the shared project carries over automatically.
              </p>
            </div>

            <div className="bg-obsidian-deep border border-white/10 rounded-xl p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-outline">
                <span>1. Host shares board</span>
                <span className="text-wellness-emerald">CYS-8941</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between text-outline">
                <span>2. Guest enters passkey</span>
                <span className="text-wellness-emerald">/join</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between text-outline">
                <span>3. Scoped access granted</span>
                <span className="text-wellness-emerald">1 board only</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between text-outline">
                <span>4. Cards sync live</span>
                <span className="text-wellness-emerald">~3s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-hanken">
          Start raising your companions today
        </h2>
        <p className="text-sm text-outline mt-3 max-w-md mx-auto">
          Your future self — and your Vitality Wolf — will thank you.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            href={primaryCta.href}
            className="h-12 px-8 rounded-lg bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-sm font-mono uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]"
          >
            <span>{primaryCta.label}</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/sign-in"
            className="h-12 px-8 rounded-lg border border-white/15 text-white font-bold text-sm font-mono uppercase tracking-wider inline-flex items-center hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-white/10">
        <div className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-outline">
            <Sparkles size={14} className="text-wellness-emerald" />
            <span>Pet Your Skills — gamified discipline & skill companions</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-mono text-outline">
            <Link href="/sign-in" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <Link href="/join" className="hover:text-white transition-colors">
              Join with Passkey
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

