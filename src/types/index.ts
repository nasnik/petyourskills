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

export interface TaskItem {
  id: string;
  domainId: string;
  boardId?: string | null;
  title: string;
  columnId: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  isCompleted: boolean;
  doneAt?: string | null;
  xpReward: number;
  estimatedMinutes?: number | null;
  repeatConfig?: {
    frequency?: "daily" | "weekdays" | "weekends" | "custom";
    days?: string[];
    time?: string;
  } | null;
  sortOrder: number;
  domain?: LifeDomainItem;
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
}
