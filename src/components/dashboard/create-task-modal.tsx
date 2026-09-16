"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/store/app-context";
import {
  X,
  Sparkles,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  Gamepad2,
  PlusCircle,
  Clock,
  Zap,
  ArrowRight,
  Check,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SkillScheduleConfig,
  getTodayString,
  addDaysToString,
} from "@/components/shared/skill-schedule-config";
import { SkillRepeatConfig } from "@/types";

// Standard Onboarding Life Domains
const SYSTEM_DOMAINS = [
  {
    id: "health",
    title: "Health & Wellness",
    desc: "Physical vitality, mental clarity, and stamina.",
    color: "#10B981",
    icon: Heart,
    defaultPet: "Vitality Wolf",
  },
  {
    id: "work",
    title: "Work & Projects",
    desc: "Career advancement, side hustles, and deliverables.",
    color: "#3B82F6",
    icon: Briefcase,
    defaultPet: "Byte Fox",
  },
  {
    id: "learning",
    title: "Learning & Growth",
    desc: "Skill acquisition, reading, and continuous education.",
    color: "#8B5CF6",
    icon: GraduationCap,
    defaultPet: "Hydro Dragon",
  },
  {
    id: "admin",
    title: "Home & Life Admin",
    desc: "Household management, personal logistics, and chores.",
    color: "#64748B",
    icon: Home,
    defaultPet: "Aegis Turtle",
  },
  {
    id: "hobbies",
    title: "Hobbies & Fun",
    desc: "Creative outlets, gaming, and pure recreation.",
    color: "#F59E0B",
    icon: Gamepad2,
    defaultPet: "Zenith Panther",
  },
  {
    id: "custom",
    title: "Add Custom Domain",
    desc: "Define a unique area of mastery for your lifestyle.",
    color: "#EC4899",
    icon: PlusCircle,
    defaultPet: "Mystery Egg",
  },
];

// Onboarding Companion Avatars
const ONBOARDING_AVATARS = [
  { id: "wisdom-owl", name: "Wisdom Owl", subtitle: "Focus / Logic", emoji: "🦉" },
  { id: "byte-fox", name: "Byte Fox", subtitle: "Agility / Code", emoji: "🦊" },
  { id: "hydro-dragon", name: "Hydro Dragon", subtitle: "Vitality / Flow", emoji: "🐉" },
  { id: "aegis-turtle", name: "Aegis Turtle", subtitle: "Endurance / Rest", emoji: "🐢" },
  { id: "zenith-panther", name: "Zenith Panther", subtitle: "Strength / Speed", emoji: "🐆" },
  { id: "vitality-wolf", name: "Vitality Wolf", subtitle: "Vigor / Health", emoji: "🐺" },
  { id: "mystery-egg", name: "Mystery Egg", subtitle: "Unknown Potential", emoji: "🥚" },
];

// 4 Skill Planning Engines from Onboarding
const SKILL_TYPES = [
  {
    id: "SPECIFIC_DATE",
    label: "One-off",
    badge: "Single Quest",
    desc: "A standalone objective for a single day",
    icon: CheckCircle2,
  },
  {
    id: "CUSTOM_SCHEDULE",
    label: "Schedule",
    badge: "Recurring Days",
    desc: "Habits and tasks on scheduled days",
    icon: Calendar,
  },
  {
    id: "MULTI_TASK",
    label: "Multi task project",
    badge: "Milestones",
    desc: "Structured deliverables & projects",
    icon: Layers,
  },
  {
    id: "DAILY_ROUTINE",
    label: "Daily routine",
    badge: "Every Day",
    desc: "Continuous day-to-day habits",
    icon: RotateCcw,
  },
];

const DURATION_PRESETS = [
  { label: "15 min", minutes: 15, xp: 25 },
  { label: "25 min", minutes: 25, xp: 35 },
  { label: "45 min", minutes: 45, xp: 60 },
  { label: "60 min", minutes: 60, xp: 100 },
];

const DOMAIN_SUGGESTIONS: Record<string, string[]> = {
  health: [
    "🏃 5km Morning Interval Run",
    "💧 2.5L Hydration Objective",
    "🧘 15m Mindfulness / Breathwork",
    "🥗 Nutrition & Meal Prep",
  ],
  work: [
    "💻 60m Deep Focus Coding Sprint",
    "📝 Draft Architecture Specification",
    "⚡ Review Pull Requests & Refactor",
    "📨 Priority Inbox Clearance",
  ],
  learning: [
    "📖 Read 20 Pages of Systems Architecture",
    "🎧 Technical Podcast Deep Dive",
    "🔬 Solve 2 Algorithm Challenges",
    "✍️ Write Technical Blog Summary",
  ],
  admin: [
    "📁 Organize Digital Workspace & Notes",
    "💳 Weekly Financial Reconciliation",
    "🧹 Clear Physical Desk Setup",
    "📦 Plan Grocery & Logistics",
  ],
  hobbies: [
    "🎸 30m Music / Creative Practice",
    "🎨 Digital Illustration Study",
    "♟️ 3 Tactical Chess Puzzles",
    "🎮 45m Relaxed Gaming Exploration",
  ],
  custom: [
    "⚡ Core Lifestyle Mastery Session",
    "🎯 Key Milestone Execution",
    "🧠 Creative Journaling & Reflection",
  ],
};

const CUSTOM_COLORS = [
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#A855F7", // Purple
  "#10B981", // Emerald
  "#EAB308", // Yellow
];

export function CreateTaskModal() {
  const {
    isCreateTaskModalOpen,
    createTaskTargetDomainId,
    closeCreateTaskModal,
    addSkillOrTask,
    domains,
  } = useApp();

  // Step 1: Selected Domain slug or ID
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string>("health");
  const [customDomainTitle, setCustomDomainTitle] = useState<string>("");
  const [customDomainColor, setCustomDomainColor] = useState<string>("#EC4899");

  // Step 2: Companion Avatar
  const [selectedAvatarName, setSelectedAvatarName] = useState<string>("Vitality Wolf");

  // Step 3: Skill Title
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 4: Skill Type (4 options from onboarding)
  const [skillType, setSkillType] = useState<
    "SPECIFIC_DATE" | "CUSTOM_SCHEDULE" | "MULTI_TASK" | "DAILY_ROUTINE"
  >("DAILY_ROUTINE");

  // Step 4.5: Dynamic Schedule / Date Configuration
  const [scheduleConfig, setScheduleConfig] = useState<SkillRepeatConfig>({
    engine: "DAILY_ROUTINE",
    frequency: "daily",
    specificDate: getTodayString(),
    scheduleType: "weekdays",
    days: ["M", "T", "W", "Th", "F"],
    startDate: getTodayString(),
    endDate: addDaysToString(getTodayString(), 7),
    durationPreset: "1 Week",
  });

  const handleSkillTypeChange = (
    newType: "SPECIFIC_DATE" | "CUSTOM_SCHEDULE" | "MULTI_TASK" | "DAILY_ROUTINE"
  ) => {
    setSkillType(newType);
    setScheduleConfig((prev) => ({
      ...prev,
      engine: newType,
      frequency:
        newType === "DAILY_ROUTINE"
          ? "daily"
          : newType === "SPECIFIC_DATE"
          ? "specific_date"
          : newType === "MULTI_TASK"
          ? "multi_task"
          : prev.scheduleType === "weekdays"
          ? "weekdays"
          : prev.scheduleType === "weekends"
          ? "weekends"
          : "custom",
      specificDate: prev.specificDate || getTodayString(),
      startDate: prev.startDate || getTodayString(),
      endDate: prev.endDate || addDaysToString(prev.startDate || getTodayString(), 7),
    }));
  };

  // Step 5: Time & XP Evaluation
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(25);
  const [xpReward, setXpReward] = useState<number>(35);
  const [isCustomTime, setIsCustomTime] = useState(false);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isCreateTaskModalOpen) {
      if (createTaskTargetDomainId) {
        const found = domains.find((d) => d.id === createTaskTargetDomainId);
        if (found) {
          setSelectedDomainSlug(found.slug);
          setSelectedAvatarName(found.avatarSpecies || "Vitality Wolf");
        }
      } else if (domains.length > 0) {
        setSelectedDomainSlug(domains[0].slug);
        setSelectedAvatarName(domains[0].avatarSpecies || "Vitality Wolf");
      }
    }
  }, [isCreateTaskModalOpen, createTaskTargetDomainId, domains]);

  // When domain changes, automatically default avatar if matching domain
  const handleSelectDomain = (slug: string) => {
    setSelectedDomainSlug(slug);

    // If user already has an active domain with this slug, use its avatar
    const existing = domains.find((d) => d.slug === slug);
    if (existing?.avatarSpecies) {
      setSelectedAvatarName(existing.avatarSpecies);
    } else {
      const sys = SYSTEM_DOMAINS.find((d) => d.id === slug);
      if (sys?.defaultPet) {
        setSelectedAvatarName(sys.defaultPet);
      }
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCreateTaskModalOpen) {
        closeCreateTaskModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateTaskModalOpen, closeCreateTaskModal]);

  if (!isCreateTaskModalOpen) return null;

  const currentSystemDomain =
    SYSTEM_DOMAINS.find((d) => d.id === selectedDomainSlug) || SYSTEM_DOMAINS[0];
  const existingDomain = domains.find((d) => d.slug === selectedDomainSlug);

  const activeColor =
    selectedDomainSlug === "custom"
      ? customDomainColor
      : existingDomain?.accentColor || currentSystemDomain.color;

  const domainDisplayName =
    selectedDomainSlug === "custom"
      ? customDomainTitle.trim() || "Custom Domain"
      : existingDomain?.name || currentSystemDomain.title;

  const selectedAvatarObj =
    ONBOARDING_AVATARS.find(
      (a) => a.name === selectedAvatarName || a.id === selectedAvatarName
    ) || ONBOARDING_AVATARS[0];

  const suggestions =
    DOMAIN_SUGGESTIONS[selectedDomainSlug] || DOMAIN_SUGGESTIONS["health"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const repeatConfig: SkillRepeatConfig = {
      ...scheduleConfig,
      engine: skillType,
    };

    addSkillOrTask({
      domainId: existingDomain?.id,
      domainSlug: selectedDomainSlug === "custom" ? "custom" : selectedDomainSlug,
      domainName: domainDisplayName,
      domainColor: activeColor,
      avatarSpecies: selectedAvatarObj.name,
      title: title.trim(),
      description: description || null,
      estimatedMinutes,
      xpReward,
      planningEngine: skillType,
      repeatConfig,
      createCompanionPet: true,
    });

    // Reset title and close
    setTitle("");
    setDescription("");
    closeCreateTaskModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-deep/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in-20 duration-200">
      <div
        className="w-full max-w-3xl bg-charcoal-surface border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between relative bg-surface-container-lowest/40">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border text-2xl shadow-lg transition-all"
              style={{
                backgroundColor: `${activeColor}20`,
                borderColor: `${activeColor}50`,
                boxShadow: `0 0 20px ${activeColor}25`,
              }}
            >
              {selectedAvatarObj.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight font-hanken">
                  Deploy New Skill Quest
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${activeColor}20`,
                    color: activeColor,
                    border: `1px solid ${activeColor}40`,
                  }}
                >
                  {domainDisplayName}
                </span>
              </div>
              <p className="text-xs font-mono text-outline mt-0.5">
                Channel discipline into {selectedAvatarObj.name}, earn XP yield, and level up.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCreateTaskModal}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-outline hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-on-surface">
          {/* Section 1: Domain Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>Select Life Domain</span>
              </label>
              <span className="text-[10px] font-mono text-outline/60">
                From System Initialization
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SYSTEM_DOMAINS.map((domain) => {
                const IconComponent = domain.icon;
                const isSelected = selectedDomainSlug === domain.id;
                const isAlreadyActive = domains.some((d) => d.slug === domain.id);

                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => handleSelectDomain(domain.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative",
                      isSelected
                        ? "bg-obsidian-deep shadow-md"
                        : "bg-surface-container-lowest/70 border-white/5 hover:border-white/20 hover:bg-surface-container-lowest"
                    )}
                    style={{
                      borderColor: isSelected ? domain.color : undefined,
                      boxShadow: isSelected
                        ? `0 0 16px ${domain.color}35`
                        : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${domain.color}20`,
                          color: domain.color,
                        }}
                      >
                        <IconComponent size={14} />
                      </div>
                      {isAlreadyActive && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/80">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {domain.title}
                    </div>
                    <div className="text-[10px] font-mono text-outline truncate mt-0.5">
                      {domain.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Domain Expansion */}
            {selectedDomainSlug === "custom" && (
              <div className="mt-3 p-4 rounded-xl border border-white/10 bg-obsidian-deep space-y-3 animate-in fade-in-20 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-mono uppercase text-outline block mb-1">
                      Custom Domain Name
                    </label>
                    <input
                      type="text"
                      value={customDomainTitle}
                      onChange={(e) => setCustomDomainTitle(e.target.value)}
                      placeholder="e.g. Creative Writing, Stock Trading, Parenting"
                      className="w-full bg-charcoal-surface border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-wellness-emerald"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-outline block mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      {CUSTOM_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setCustomDomainColor(col)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center",
                            customDomainColor === col
                              ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-obsidian-deep"
                              : "hover:scale-105 opacity-80"
                          )}
                          style={{ backgroundColor: col }}
                        >
                          {customDomainColor === col && (
                            <Check size={12} className="text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Avatar Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <span>Choose Companion Avatar for this Domain</span>
              </label>
              <span className="text-[11px] font-mono text-wellness-emerald font-semibold flex items-center gap-1">
                <span>Selected:</span>
                <span>{selectedAvatarObj.name}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ONBOARDING_AVATARS.map((avatar) => {
                const isSelected =
                  selectedAvatarName === avatar.name ||
                  selectedAvatarName === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatarName(avatar.name)}
                    className={cn(
                      "p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-obsidian-deep border-wellness-emerald shadow-[0_0_15px_rgba(16,185,129,0.25)] scale-102"
                        : "bg-surface-container-lowest/60 border-white/5 hover:border-white/20 hover:bg-surface-container-lowest"
                    )}
                  >
                    <div className="text-2xl mb-1">{avatar.emoji}</div>
                    <div className="text-xs font-bold text-white leading-tight truncate w-full">
                      {avatar.name}
                    </div>
                    <div className="text-[9px] font-mono text-outline mt-0.5 truncate w-full">
                      {avatar.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Skill / Quest Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <span>Skill Title / Objective</span>
              </label>
              <span className="text-[10px] text-wellness-emerald flex items-center gap-1 font-mono">
                <Sparkles size={11} />
                <span>Synchronized with Neon DB</span>
              </span>
            </div>

            <input
              type="text"
              id="skill-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5km Morning Interval Run or Frontend Architecture Study"
              className="w-full bg-obsidian-deep border border-surface-bright rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-outline/40 focus:outline-none focus:border-wellness-emerald transition-colors"
              required
            />

            {/* Optional Description */}
            <textarea
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this quest or project milestone... (optional)"
              rows={2}
              className="mt-2 w-full bg-obsidian-deep border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-outline/40 focus:outline-none focus:border-wellness-emerald transition-colors resize-none"
            />

            {/* Quick Suggestions Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-mono text-outline mr-1">
                Quick ideas:
              </span>
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTitle(sug)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-surface-container-lowest border border-white/10 text-outline hover:text-white hover:border-white/30 transition-all cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: 4 Options for Skill Type / Planning Engine (like onboarding) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                <span>Type of the Skill & Planning Engine</span>
              </label>
              <span className="text-[10px] font-mono text-outline/60">
                From Onboarding Skill Setup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SKILL_TYPES.map((type) => {
                const IconComp = type.icon;
                const isSelected = skillType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      handleSkillTypeChange(
                        type.id as
                          | "SPECIFIC_DATE"
                          | "CUSTOM_SCHEDULE"
                          | "MULTI_TASK"
                          | "DAILY_ROUTINE"
                      )
                    }
                    className={cn(
                      "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      isSelected
                        ? "bg-obsidian-deep border-white text-white shadow-md ring-1 ring-white/20"
                        : "bg-surface-container-lowest/60 border-white/5 hover:border-white/20 text-outline hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "bg-white text-obsidian-deep"
                          : "bg-white/5 text-outline"
                      )}
                    >
                      <IconComp size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-white">
                          {type.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-outline">
                          {type.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-outline mt-0.5 leading-snug">
                        {type.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Schedule / Date Configurator */}
            <div className="mt-3">
              <SkillScheduleConfig
                engine={skillType}
                config={scheduleConfig}
                onChange={setScheduleConfig}
                accentColor={activeColor}
              />
            </div>
          </div>

          {/* Section 5: Time & XP Evaluation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-outline flex items-center gap-1.5 font-semibold">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                  5
                </span>
                <span>Time & XP Evaluation</span>
              </label>
              <span className="text-xs font-mono text-wellness-emerald font-semibold flex items-center gap-1">
                <Zap size={13} className="fill-wellness-emerald text-wellness-emerald" />
                <span>Yield: +{xpReward} XP</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DURATION_PRESETS.map((preset) => {
                const isSelected =
                  !isCustomTime &&
                  estimatedMinutes === preset.minutes &&
                  xpReward === preset.xp;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsCustomTime(false);
                      setEstimatedMinutes(preset.minutes);
                      setXpReward(preset.xp);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center",
                      isSelected
                        ? "bg-wellness-emerald/15 border-wellness-emerald text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-surface-container-lowest/60 border-white/10 text-outline hover:text-white hover:border-white/20"
                    )}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Clock size={12} />
                      <span>{preset.label}</span>
                    </span>
                    <span className="text-[11px] font-mono text-wellness-emerald mt-0.5 font-semibold">
                      +{preset.xp} XP
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Time Option Toggle */}
            <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsCustomTime(!isCustomTime)}
                className="text-outline hover:text-white text-[11px] underline cursor-pointer"
              >
                {isCustomTime ? "Use Quick Presets" : "Custom duration & XP"}
              </button>

              {isCustomTime && (
                <div className="flex items-center gap-3 animate-in fade-in-20 duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-outline text-[11px]">Minutes:</span>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-16 bg-obsidian-deep border border-white/15 rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-wellness-emerald"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-outline text-[11px]">XP:</span>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={xpReward}
                      onChange={(e) => setXpReward(Number(e.target.value))}
                      className="w-16 bg-obsidian-deep border border-white/15 rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-wellness-emerald"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-white/10">
            <div className="text-xs font-mono text-outline flex items-center gap-2">
              <span className="text-xl">{selectedAvatarObj.emoji}</span>
              <span className="hidden sm:inline">
                {selectedAvatarObj.name} will gain +{xpReward} XP upon completion
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeCreateTaskModal}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-outline hover:text-white hover:border-white/20 text-xs font-mono transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="deploy-skill-quest-btn"
                disabled={!title.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-wellness-emerald to-emerald-400 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Deploy Quest (+{xpReward} XP)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
