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
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SkillScheduleConfig,
  getTodayString,
  addDaysToString,
} from "@/components/shared/skill-schedule-config";
import { SkillRepeatConfig } from "@/types";

interface OnboardingSkillItem {
  id: string;
  title: string;
  engine: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
  repeatConfig: SkillRepeatConfig;
}

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
    color: "#06B6D4",
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
  const [customDomainName, setCustomDomainName] = useState("");
  const [customDomainColor, setCustomDomainColor] = useState("#06B6D4");

  // Step 2: Companion assignments (domainId -> companionId)
  const [assignedCompanions, setAssignedCompanions] = useState<Record<string, string>>({
    health: "byte-fox",
    work: "wisdom-owl",
    learning: "hydro-dragon",
  });

  // Step 3: Skill definitions (domainId -> OnboardingSkillItem[])
  const [skills, setSkills] = useState<Record<string, OnboardingSkillItem[]>>({
    work: [
      {
        id: "work-default-1",
        title: "Frontend Engineering",
        engine: "DAILY_ROUTINE",
        repeatConfig: {
          engine: "DAILY_ROUTINE",
          frequency: "daily",
        },
      },
    ],
    health: [
      {
        id: "health-default-1",
        title: "Marathon Training",
        engine: "CUSTOM_SCHEDULE",
        repeatConfig: {
          engine: "CUSTOM_SCHEDULE",
          frequency: "weekdays",
          scheduleType: "weekdays",
          days: ["M", "T", "W", "Th", "F"],
        },
      },
    ],
    learning: [
      {
        id: "learning-default-1",
        title: "Next.js 15 & System Architecture",
        engine: "MULTI_TASK",
        repeatConfig: {
          engine: "MULTI_TASK",
          frequency: "multi_task",
          startDate: getTodayString(),
          endDate: addDaysToString(getTodayString(), 7),
          durationPreset: "1 Week",
        },
      },
    ],
  });

  const getDomainMeta = (domainId: string) => {
    if (domainId === "custom") {
      return {
        id: "custom",
        title: customDomainName.trim() || "Custom Domain",
        desc: "Define a unique area of mastery specific to your lifestyle.",
        color: customDomainColor,
        icon: PlusCircle,
      };
    }
    const found = DOMAIN_OPTIONS.find((d) => d.id === domainId);
    return (
      found || {
        id: domainId,
        title: domainId,
        desc: "",
        color: "#ffffff",
        icon: PlusCircle,
      }
    );
  };

  const getDomainSkills = (domainId: string): OnboardingSkillItem[] => {
    if (skills[domainId] && skills[domainId].length > 0) {
      return skills[domainId];
    }
    const domainMeta = getDomainMeta(domainId);
    const defaultTitle =
      domainId === "custom" && customDomainName.trim()
        ? `${customDomainName.trim()} Mastery`
        : domainId === "admin"
        ? "Home & Life Admin Routine"
        : domainId === "hobbies"
        ? "Creative Practice & Game Dev"
        : `${domainMeta.title} Discipline`;

    return [
      {
        id: `${domainId}-default-1`,
        title: defaultTitle,
        engine: "DAILY_ROUTINE",
        repeatConfig: {
          engine: "DAILY_ROUTINE",
          frequency: "daily",
        },
      },
    ];
  };

  const handleAddSkill = (domainId: string) => {
    const currentList = getDomainSkills(domainId);
    const domainMeta = getDomainMeta(domainId);
    const newIndex = currentList.length + 1;
    const newSkill: OnboardingSkillItem = {
      id: `${domainId}-skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${domainMeta.title} Project ${newIndex}`,
      engine: "DAILY_ROUTINE",
      repeatConfig: {
        engine: "DAILY_ROUTINE",
        frequency: "daily",
      },
    };
    setSkills((prev) => ({
      ...prev,
      [domainId]: [...currentList, newSkill],
    }));
  };

  const handleRemoveSkill = (domainId: string, skillId: string) => {
    const currentList = getDomainSkills(domainId);
    if (currentList.length <= 1) return;
    setSkills((prev) => ({
      ...prev,
      [domainId]: currentList.filter((s) => s.id !== skillId),
    }));
  };

  const handleSkillTitleChange = (domainId: string, skillId: string, title: string) => {
    const currentList = getDomainSkills(domainId);
    setSkills((prev) => ({
      ...prev,
      [domainId]: currentList.map((s) => (s.id === skillId ? { ...s, title } : s)),
    }));
  };

  const handleSkillRepeatConfigChange = (
    domainId: string,
    skillId: string,
    repeatConfig: SkillRepeatConfig
  ) => {
    const currentList = getDomainSkills(domainId);
    setSkills((prev) => ({
      ...prev,
      [domainId]: currentList.map((s) =>
        s.id === skillId ? { ...s, repeatConfig } : s
      ),
    }));
  };

  const handleEngineChange = (
    domainId: string,
    skillId: string,
    newEngine: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE"
  ) => {
    const currentList = getDomainSkills(domainId);
    setSkills((prev) => ({
      ...prev,
      [domainId]: currentList.map((s) => {
        if (s.id !== skillId) return s;
        return {
          ...s,
          engine: newEngine,
          repeatConfig: {
            ...s.repeatConfig,
            engine: newEngine,
            frequency:
              newEngine === "DAILY_ROUTINE"
                ? "daily"
                : newEngine === "SPECIFIC_DATE"
                ? "specific_date"
                : newEngine === "MULTI_TASK"
                ? "multi_task"
                : s.repeatConfig?.scheduleType === "weekdays"
                ? "weekdays"
                : s.repeatConfig?.scheduleType === "weekends"
                ? "weekends"
                : "custom",
            specificDate: s.repeatConfig?.specificDate || getTodayString(),
            startDate: s.repeatConfig?.startDate || getTodayString(),
            endDate:
              s.repeatConfig?.endDate ||
              addDaysToString(s.repeatConfig?.startDate || getTodayString(), 7),
            days: s.repeatConfig?.days || ["M", "T", "W", "Th", "F"],
          },
        };
      }),
    }));
  };

  const [isLaunching, setIsLaunching] = useState(false);

  const toggleDomain = (id: string) => {
    if (selectedDomains.includes(id)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== id));
    } else {
      setSelectedDomains([...selectedDomains, id]);
      if (!assignedCompanions[id]) {
        setAssignedCompanions((prev) => ({
          ...prev,
          [id]: id === "custom" ? "mystery-egg" : "wisdom-owl",
        }));
      }
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const { saveOnboardingAction } = await import("@/actions/auth");
      const email = typeof window !== "undefined" ? sessionStorage.getItem("onboarding_email") || undefined : undefined;
      const normalizedSkills: Record<string, OnboardingSkillItem[]> = {};
      for (const domainId of selectedDomains) {
        normalizedSkills[domainId] = getDomainSkills(domainId);
      }
      const res = await saveOnboardingAction({
        selectedDomains,
        assignedCompanions,
        skills: normalizedSkills,
        email,
        customDomainName: customDomainName.trim() || "Custom Domain",
        customDomainColor,
      });
      if (!res?.success) {
        console.warn("Save onboarding warning:", res?.error);
      }
    } catch (e) {
      console.error("Failed to save onboarding:", e);
    }
    window.location.href = "/dashboard";
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
              const isCustom = item.id === "custom";
              const isSelected = selectedDomains.includes(item.id);
              const cardColor = isCustom && isSelected ? customDomainColor : item.color;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleDomain(item.id)}
                  className={cn(
                    "p-5 rounded border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[11rem]",
                    isSelected
                      ? "bg-charcoal-surface border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                      : "bg-surface-container-lowest/50 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: `${cardColor}20`,
                        color: cardColor,
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

                  <div className="mt-3">
                    {isCustom && isSelected ? (
                      <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-[11px] font-mono uppercase font-bold text-white tracking-wider block mb-1">
                            Custom Domain Name
                          </label>
                          <input
                            type="text"
                            value={customDomainName}
                            onChange={(e) => setCustomDomainName(e.target.value)}
                            placeholder="e.g. Creative Writing, Investing"
                            autoFocus
                            className="w-full bg-obsidian-deep border border-white/25 focus:border-wellness-emerald rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-outline/40 outline-none transition-colors"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-mono text-outline mr-1">Color:</span>
                          {["#06B6D4", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6"].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setCustomDomainColor(col)}
                              className={cn(
                                "w-4 h-4 rounded-full transition-transform cursor-pointer",
                                customDomainColor === col
                                  ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-charcoal-surface"
                                  : "opacity-60 hover:opacity-100"
                              )}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-sm text-white mb-1">
                          {isCustom && customDomainName.trim() ? customDomainName.trim() : item.title}
                        </h3>
                        <p className="text-xs text-outline leading-relaxed">
                          {item.desc}
                        </p>
                      </>
                    )}
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
              const domain = getDomainMeta(domainId);

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
            {selectedDomains.map((domainId) => {
              const domain = getDomainMeta(domainId);
              const compId = assignedCompanions[domainId] || "wisdom-owl";
              const companion = COMPANIONS.find((c) => c.id === compId);
              const domainSkillsList = getDomainSkills(domainId);

              return (
                <div
                  key={domainId}
                  className="p-6 rounded border border-white/10 bg-charcoal-surface space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shadow-inner border"
                        style={{
                          backgroundColor: `${domain?.color}20`,
                          borderColor: `${domain?.color}40`,
                        }}
                      >
                        {companion?.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                            style={{
                              backgroundColor: `${domain?.color}20`,
                              color: domain?.color,
                            }}
                          >
                            {domain?.title}
                          </span>
                          <span className="text-[10px] font-mono text-outline">
                            {domainSkillsList.length} {domainSkillsList.length === 1 ? "Skill / Project" : "Skills / Projects"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {companion?.name} Focus Hub
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* List of Skills / Projects for this domain */}
                  <div className="space-y-4">
                    {domainSkillsList.map((skillItem, sIdx) => {
                      const isMulti = domainSkillsList.length > 1;
                      return (
                        <div
                          key={skillItem.id}
                          className="p-4 rounded-lg border border-white/10 bg-obsidian-deep/70 space-y-4 relative transition-all"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${domain?.color}25`,
                                  color: domain?.color,
                                }}
                              >
                                {isMulti ? `Skill / Project #${sIdx + 1}` : "Primary Skill"}
                              </span>
                              <span className="text-xs font-mono text-white/90 font-semibold truncate max-w-[200px] sm:max-w-xs">
                                {skillItem.title || "Untitled Skill"}
                              </span>
                            </div>

                            {isMulti && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(domainId, skillItem.id)}
                                className="text-outline hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                                title="Remove this skill"
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-mono uppercase text-outline mb-1.5">
                              Skill or Project Name
                            </label>
                            <input
                              type="text"
                              value={skillItem.title}
                              onChange={(e) =>
                                handleSkillTitleChange(domainId, skillItem.id, e.target.value)
                              }
                              placeholder="e.g. Frontend Engineering, Marathon Training, Spanish Fluency..."
                              className="w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-mono uppercase text-outline mb-2">
                              Planning Engine
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
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
                                    handleEngineChange(
                                      domainId,
                                      skillItem.id,
                                      eng.id as
                                        | "DAILY_ROUTINE"
                                        | "MULTI_TASK"
                                        | "CUSTOM_SCHEDULE"
                                        | "SPECIFIC_DATE"
                                    )
                                  }
                                  className={cn(
                                    "p-2.5 rounded border cursor-pointer transition-all",
                                    skillItem.engine === eng.id
                                      ? "bg-obsidian-deep border-white text-white shadow-md ring-1 ring-white/20"
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

                            {/* Dynamic Schedule & Date Configurator */}
                            <div className="mt-3.5">
                              <SkillScheduleConfig
                                engine={skillItem.engine}
                                config={skillItem.repeatConfig || { engine: skillItem.engine }}
                                onChange={(newConfig) =>
                                  handleSkillRepeatConfigChange(domainId, skillItem.id, newConfig)
                                }
                                accentColor={domain?.color || "#10B981"}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Skill / Project to this Domain Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSkill(domainId)}
                    className="w-full py-3 px-4 rounded-lg border border-dashed border-white/20 hover:border-white/50 hover:bg-white/[0.04] text-xs font-mono text-white/90 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm"
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${domain?.color || "#10B981"}25`,
                        color: domain?.color || "#10B981",
                      }}
                    >
                      <Plus size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-semibold">Add Skill / Project to {domain?.title}</span>
                  </button>
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
