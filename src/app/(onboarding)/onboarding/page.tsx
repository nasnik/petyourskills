"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  Gamepad2,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Check,
  Calendar,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOMAIN_OPTIONS = [
  {
    id: "health",
    title: "Health & Wellness",
    desc: "Physical health, mental clarity, and restorative practices.",
    color: "#10B981",
    icon: Heart,
  },
  {
    id: "work",
    title: "Work & Projects",
    desc: "Career advancement, side hustles, and major deliverables.",
    color: "#3B82F6",
    icon: Briefcase,
  },
  {
    id: "learning",
    title: "Learning & Growth",
    desc: "Skill acquisition, reading, and continuous education.",
    color: "#8B5CF6",
    icon: GraduationCap,
  },
  {
    id: "admin",
    title: "Home & Life Admin",
    desc: "Household management, chores, and personal logistics.",
    color: "#64748B",
    icon: Home,
  },
  {
    id: "hobbies",
    title: "Hobbies & Fun",
    desc: "Creative outlets, gaming, and pure recreation.",
    color: "#F59E0B",
    icon: Gamepad2,
  },
  {
    id: "custom",
    title: "Add Your Custom Domain",
    desc: "Define a unique area of mastery specific to your lifestyle.",
    color: "#ffffff",
    icon: PlusCircle,
  },
];

const COMPANIONS = [
  { id: "wisdom-owl", name: "Wisdom Owl", subtitle: "Focus / Logic", emoji: "🦉" },
  { id: "byte-fox", name: "Byte Fox", subtitle: "Agility / Code", emoji: "🦊" },
  { id: "hydro-dragon", name: "Hydro Dragon", subtitle: "Vitality / Flow", emoji: "🐉" },
  { id: "aegis-turtle", name: "Aegis Turtle", subtitle: "Endurance / Rest", emoji: "🐢" },
  { id: "zenith-panther", name: "Zenith Panther", subtitle: "Strength / Speed", emoji: "🐆" },
  { id: "mystery-egg", name: "Mystery Egg", subtitle: "Unknown Potential", emoji: "🥚" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Domains
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    "health",
    "work",
    "learning",
  ]);

  // Step 2: Companion assignments (domainId -> companionId)
  const [assignedCompanions, setAssignedCompanions] = useState<Record<string, string>>({
    health: "byte-fox",
    work: "wisdom-owl",
    learning: "hydro-dragon",
  });

  // Step 3: Skill definitions
  const [skills, setSkills] = useState<Record<string, { title: string; engine: string }>>({
    work: { title: "Frontend Engineering", engine: "DAILY_ROUTINE" },
    health: { title: "Marathon Training", engine: "CUSTOM_SCHEDULE" },
    learning: { title: "Next.js 15 & System Architecture", engine: "MULTI_TASK" },
  });

  const [isLaunching, setIsLaunching] = useState(false);

  const toggleDomain = (id: string) => {
    if (selectedDomains.includes(id)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== id));
    } else {
      setSelectedDomains([...selectedDomains, id]);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const { saveOnboardingAction } = await import("@/actions/auth");
      const email = typeof window !== "undefined" ? sessionStorage.getItem("onboarding_email") || undefined : undefined;
      await saveOnboardingAction({
        email,
        selectedDomains,
        assignedCompanions,
        skills,
      });
    } catch (e) {
      console.error("Failed to save onboarding:", e);
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-obsidian-deep text-on-surface p-6 md:p-12 flex flex-col items-center">
      {/* Logo & Step Tracker */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-wellness-emerald" />
          <span className="font-bold text-sm tracking-tight text-white">
            PET YOUR SKILLS
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-hanken mb-6">
          System Initialization
        </h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-bold border",
                step >= 1
                  ? "bg-white text-obsidian-deep border-white"
                  : "border-white/20 text-outline"
              )}
            >
              1
            </span>
            <span className={step === 1 ? "text-white font-bold" : "text-outline"}>
              DOMAINS
            </span>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-bold border",
                step >= 2
                  ? "bg-white text-obsidian-deep border-white"
                  : "border-white/20 text-outline"
              )}
            >
              2
            </span>
            <span className={step === 2 ? "text-white font-bold" : "text-outline"}>
              AVATARS
            </span>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-bold border",
                step >= 3
                  ? "bg-white text-obsidian-deep border-white"
                  : "border-white/20 text-outline"
              )}
            >
              3
            </span>
            <span className={step === 3 ? "text-white font-bold" : "text-outline"}>
              DEFINE SKILLS
            </span>
          </div>
        </div>
      </div>

      {/* Wizard Step 1: Select Domains */}
      {step === 1 && (
        <div className="w-full max-w-3xl space-y-8 animate-in fade-in-20 duration-200">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white font-hanken">
              Select Your Focus Domains
            </h2>
            <p className="text-xs font-mono text-outline mt-1">
              Identify the key areas of your life you intend to master. This will structure your dashboard and progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOMAIN_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedDomains.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleDomain(item.id)}
                  className={cn(
                    "p-5 rounded border transition-all duration-200 cursor-pointer flex flex-col justify-between h-44",
                    isSelected
                      ? "bg-charcoal-surface border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                      : "bg-surface-container-lowest/50 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-wellness-emerald border-wellness-emerald text-obsidian-deep"
                          : "border-white/20"
                      )}
                    >
                      {isSelected && <Check size={13} className="stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-outline leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={selectedDomains.length === 0}
              className="h-11 px-6 rounded bg-white text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-white/90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Initialize Core</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 2: Assign Companions */}
      {step === 2 && (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in-20 duration-200">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white font-hanken">
              Assign Your Skill Companions
            </h2>
            <p className="text-xs font-mono text-outline mt-1">
              Choose an egg or pet companion to guardian each selected life domain. These avatars will evolve as you log focus hours.
            </p>
          </div>

          <div className="space-y-6">
            {selectedDomains.map((domainId) => {
              const domain = DOMAIN_OPTIONS.find((d) => d.id === domainId);
              if (!domain) return null;

              return (
                <div
                  key={domainId}
                  className="p-5 rounded border border-white/10 bg-charcoal-surface space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                      {domain.title} Guardian
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {COMPANIONS.map((comp) => {
                      const isChosen = assignedCompanions[domainId] === comp.id;

                      return (
                        <div
                          key={comp.id}
                          onClick={() =>
                            setAssignedCompanions((prev) => ({
                              ...prev,
                              [domainId]: comp.id,
                            }))
                          }
                          className={cn(
                            "p-3 rounded border flex flex-col items-center text-center cursor-pointer transition-all",
                            isChosen
                              ? "bg-obsidian-deep border-wellness-emerald shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                              : "bg-surface-container-lowest border-white/5 hover:border-white/20"
                          )}
                        >
                          <div className="text-2xl mb-1">{comp.emoji}</div>
                          <span className="text-xs font-bold text-white leading-tight">
                            {comp.name}
                          </span>
                          <span className="text-[10px] font-mono text-outline mt-0.5">
                            {comp.subtitle}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="h-10 px-4 rounded border border-white/10 text-outline hover:text-white flex items-center gap-2 text-xs font-mono cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="h-11 px-6 rounded bg-gradient-to-r from-learning-violet to-work-electric-blue text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <span>Configure Skills</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 3: Define Skills & Planning Engine */}
      {step === 3 && (
        <div className="w-full max-w-3xl space-y-8 animate-in fade-in-20 duration-200">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white font-hanken">
              Define Skills & Planning Engine
            </h2>
            <p className="text-xs font-mono text-outline mt-1">
              Set up the skills your pets will level up with, and choose how you plan to track them.
            </p>
          </div>

          <div className="space-y-6">
            {selectedDomains.slice(0, 2).map((domainId) => {
              const domain = DOMAIN_OPTIONS.find((d) => d.id === domainId);
              const compId = assignedCompanions[domainId] || "wisdom-owl";
              const companion = COMPANIONS.find((c) => c.id === compId);
              const skillData = skills[domainId] || {
                title: "Daily Discipline Routine",
                engine: "DAILY_ROUTINE",
              };

              return (
                <div
                  key={domainId}
                  className="p-6 rounded border border-white/10 bg-charcoal-surface space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: `${domain?.color}15`,
                          color: domain?.color,
                        }}
                      >
                        {domain?.title}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {companion?.name}
                      </h3>
                      <p className="text-xs text-outline font-mono">
                        Core companion for knowledge, engineering, and personal progress.
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-obsidian-deep border border-white/10 flex items-center justify-center text-3xl">
                      {companion?.emoji}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                      Primary Skill Name
                    </label>
                    <input
                      type="text"
                      value={skillData.title}
                      onChange={(e) =>
                        setSkills((prev) => ({
                          ...prev,
                          [domainId]: { ...skillData, title: e.target.value },
                        }))
                      }
                      className="w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-outline mb-2">
                      Planning Engine
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          id: "DAILY_ROUTINE",
                          title: "Daily Routine",
                          desc: "Continuous day-to-day habits",
                        },
                        {
                          id: "MULTI_TASK",
                          title: "Multi-Task Project",
                          desc: "Structured milestones & tasks",
                        },
                        {
                          id: "CUSTOM_SCHEDULE",
                          title: "Custom Schedule",
                          desc: "Recurring habits on specific days",
                        },
                        {
                          id: "SPECIFIC_DATE",
                          title: "Specific Date",
                          desc: "A standalone event scheduled for a single day",
                        },
                      ].map((eng) => (
                        <div
                          key={eng.id}
                          onClick={() =>
                            setSkills((prev) => ({
                              ...prev,
                              [domainId]: { ...skillData, engine: eng.id },
                            }))
                          }
                          className={cn(
                            "p-3 rounded border cursor-pointer transition-all",
                            skillData.engine === eng.id
                              ? "bg-obsidian-deep border-white text-white"
                              : "bg-surface-container-lowest border-white/5 text-outline hover:border-white/20 hover:text-white"
                          )}
                        >
                          <div className="text-xs font-bold font-mono">
                            {eng.title}
                          </div>
                          <div className="text-[10px] text-outline mt-0.5">
                            {eng.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="h-10 px-4 rounded border border-white/10 text-outline hover:text-white flex items-center gap-2 text-xs font-mono cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              onClick={handleLaunch}
              className="h-11 px-8 rounded bg-gradient-to-r from-wellness-emerald to-work-electric-blue text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <span>Launch Core System</span>
              <Rocket size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
