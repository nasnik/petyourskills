export type LifeDomainSlug =
  | "health"
  | "work"
  | "learning"
  | "volunteering"
  | "hobbies"
  | "admin";

export interface LifeDomainItem {
  id: string;
  userId: string;
  name: string;
  slug: LifeDomainSlug | string;
  accentColor: string;
  avatarSpecies: string;
  level: number;
  currentXp: number;
  isActive: boolean;
  skillPets?: SkillPetItem[];
}

export interface SkillPetItem {
  id: string;
  domainId: string;
  title: string;
  level: number;
  currentXp: number;
  nextEvolutionThreshold: number;
  perks?: Record<string, unknown> | null;
  planningEngineType: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
}

export interface SkillRepeatConfig {
  [key: string]: unknown;
  frequency?: "daily" | "weekdays" | "weekends" | "custom" | "specific_date" | "multi_task";
  days?: string[];
  time?: string;
  engine?: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE" | string;
  specificDate?: string; // YYYY-MM-DD for One-off / SPECIFIC_DATE
  scheduleType?: "days_of_week" | "weekdays" | "weekends" | "custom_dates";
  customDates?: string[]; // Array of YYYY-MM-DD for particular multiple dates
  startDate?: string; // YYYY-MM-DD for Multi-task project
  endDate?: string; // YYYY-MM-DD for Multi-task project
  durationPreset?: string; // e.g. "1 week", "2 weeks", "1 month", "custom"
  excludedDates?: string[]; // Array of YYYY-MM-DD dates excluded from schedule
}

export interface TaskItem {
  id: string;
  domainId: string;
  boardId?: string | null;
  title: string;
  description?: string | null;
  columnId: "TODO" | "IN_PROGRESS" | "DONE";
  isCompleted: boolean;
  doneAt?: string | null;
  xpReward: number;
  estimatedMinutes?: number | null;
  repeatConfig?: SkillRepeatConfig | null;
  sortOrder: number;
  domain?: LifeDomainItem;
  planningEngineType?: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
  assignee?: { id: string; name: string; avatar?: string } | null;
}

export interface CommentItem {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSessionItem {
  id: string;
  userId: string;
  taskId?: string | null;
  durationSeconds: number;
  verifiedXp: number;
  startedAt: string;
  completedAt: string;
  task?: TaskItem | null;
}

export interface KanbanBoardItem {
  id: string;
  domainId?: string | null;
  ownerId: string;
  title: string;
  isShared: boolean;
  passCode?: string | null;
  inviteToken?: string | null;
  tasks: TaskItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  callSign: string;
  rankTier: number;
  rankTitle: string;
  totalXp: number;
  tierProgress: number; // 0 to 100%
  nextTierXp: number;
  isAnonymous?: boolean;
  sharedProjectId?: string | null;
}
