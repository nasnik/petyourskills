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
  /** Emoji avatar chosen by the user on join (e.g. "🐉"). */
  avatar?: string;
}

/**
 * A member of a shared project board.
 * This is the foundation for:
 *  - Team presence strip (current feature)
 *  - Members chat & @mentions (next)
 *  - Growing avatars based on board activity (next)
 */
export interface ProjectMember {
  id: string;
  name: string;
  /** Emoji avatar chosen at join time. */
  avatar: string;
  /** True for the project owner / host. */
  isHost: boolean;
  /**
   * Count of board actions (tasks created + completed).
   * Seeds the visual "growth" ring on the avatar bubble and will
   * power the growing-avatars XP system.
   */
  activityCount: number;
  joinedAt: string; // ISO timestamp
}

export type MessageType = "TEXT" | "SYSTEM_QUEST_LOG" | "COMPANION_EVENT";

/**
 * A Squad Channel message scoped to a shared project board.
 * `TEXT` messages carry a sender's companion badge; `SYSTEM_QUEST_LOG`
 * messages are automated quest-completion broadcasts.
 */
export interface BoardMessageItem {
  id: string;
  boardId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  type: MessageType;
  /** Snapshot e.g. "Byte Fox Lv.80" bound to the sender's companion. */
  companionBadge?: string | null;
  /** Populated for SYSTEM_QUEST_LOG events. */
  xpRewardYield?: number | null;
  createdAt: string; // ISO timestamp
}

/** A squad member's presence snapshot used for presence telemetry. */
export interface SquadPresence {
  userId: string;
  name: string;
  avatar: string;
  /** True while the member has an active deep-focus session running. */
  isFocusing: boolean;
  onlineAt: string; // ISO timestamp
}
