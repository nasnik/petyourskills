import { FocusSessionItem, TaskItem, LifeDomainItem } from "@/types";

export type Timeframe = "Day" | "Week" | "Month" | "Year";

export function getTimeframeMs(timeframe: Timeframe): number {
  switch (timeframe) {
    case "Day": return 24 * 60 * 60 * 1000;
    case "Week": return 7 * 24 * 60 * 60 * 1000;
    case "Month": return 30 * 24 * 60 * 60 * 1000;
    case "Year": return 365 * 24 * 60 * 60 * 1000;
  }
}

export function filterSessionsByTimeframe(
  sessions: FocusSessionItem[],
  timeframe: Timeframe
): FocusSessionItem[] {
  const cutoff = Date.now() - getTimeframeMs(timeframe);
  return sessions.filter((s) => new Date(s.completedAt).getTime() >= cutoff);
}

export function calculateTotalFocusTime(sessions: FocusSessionItem[]): number {
  return sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function calculateCompletedTasks(sessions: FocusSessionItem[], tasks: TaskItem[]): number {
  const taskIds = new Set(sessions.map(s => s.taskId).filter(Boolean));
  return Array.from(taskIds).filter(id => {
    const task = tasks.find(t => t.id === id);
    return task?.isCompleted;
  }).length;
}

export function calculateTaskCompletionRate(sessions: FocusSessionItem[], tasks: TaskItem[]): number {
  const taskIds = new Set(sessions.map(s => s.taskId).filter(Boolean));
  const relevantTasks = Array.from(taskIds).map(id => tasks.find(t => t.id === id)).filter(Boolean);
  if (relevantTasks.length === 0) return 0;
  const completed = relevantTasks.filter(t => t!.isCompleted).length;
  return Math.round((completed / relevantTasks.length) * 100);
}

export function calculateTotalXP(sessions: FocusSessionItem[]): number {
  return sessions.reduce((sum, s) => sum + s.verifiedXp, 0);
}

export function calculateStreak(sessions: FocusSessionItem[]): number {
  if (sessions.length === 0) return 0;
  
  const dates = [...new Set(sessions.map(s => s.completedAt.split('T')[0]))]
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);
  
  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  
  if (dates[0] !== todayMs) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0] !== yesterday.getTime()) return 0;
  }
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    prev.setDate(prev.getDate() - 1);
    if (prev.getTime() === curr.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getDomainFocusData(
  sessions: FocusSessionItem[],
  tasks: TaskItem[],
  domains: LifeDomainItem[],
  timeframe: Timeframe
): Array<{
  domainId: string;
  domainName: string;
  species: string;
  color: string;
  hours: number;
  tasksDone: number;
  tasksTotal: number;
  percentage: number;
  yieldXp: number;
}> {
  const filtered = filterSessionsByTimeframe(sessions, timeframe);
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  const domainStats = new Map<string, {
    hours: number;
    taskIds: Set<string>;
    yieldXp: number;
  }>();
  
  filtered.forEach(s => {
    if (!s.taskId) return;
    const task = taskMap.get(s.taskId);
    if (!task) return;
    
    const domainId = task.domainId;
    const existing = domainStats.get(domainId) || { hours: 0, taskIds: new Set(), yieldXp: 0 };
    existing.hours += s.durationSeconds / 3600;
    existing.taskIds.add(s.taskId);
    existing.yieldXp += s.verifiedXp;
    domainStats.set(domainId, existing);
  });
  
  return Array.from(domainStats.entries())
    .map(([domainId, stats]) => {
      const domain = domains.find(d => d.id === domainId);
      const domainTasks = tasks.filter(t => t.domainId === domainId);
      const completedInPeriod = Array.from(stats.taskIds).filter(id => {
        const task = taskMap.get(id);
        return task?.isCompleted;
      }).length;
      
      return {
        domainId,
        domainName: domain?.name || "Unknown",
        species: domain?.avatarSpecies || "Vitality Wolf",
        color: domain?.accentColor || "#10B981",
        hours: Math.round(stats.hours * 10) / 10,
        tasksDone: completedInPeriod,
        tasksTotal: domainTasks.length,
        percentage: domainTasks.length > 0 ? Math.round((completedInPeriod / domainTasks.length) * 100) : 0,
        yieldXp: stats.yieldXp,
      };
    })
    .filter(d => d.hours > 0 || d.tasksDone > 0)
    .sort((a, b) => b.hours - a.hours);
}

export function getDailyFocusData(
  sessions: FocusSessionItem[],
  tasks: TaskItem[],
  domains: LifeDomainItem[],
  timeframe: Timeframe
): Array<{
  day: string;
  date: Date;
  health: number;
  work: number;
  learning: number;
  volunteering: number;
  totalHours: number;
}> {
  const filtered = filterSessionsByTimeframe(sessions, timeframe);
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const domainMap = new Map(domains.map(d => [d.id, d]));
  
  const dayCount = timeframe === "Day" ? 1 : timeframe === "Week" ? 7 : timeframe === "Month" ? 30 : 365;
  const now = new Date();
  const data = [];
  
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const daySessions = filtered.filter(s => {
      const d = new Date(s.completedAt);
      return d >= date && d < nextDay;
    });
    
    const domainHours: Record<string, number> = {
      health: 0,
      work: 0,
      learning: 0,
      volunteering: 0,
    };
    
    daySessions.forEach(s => {
      if (!s.taskId) return;
      const task = taskMap.get(s.taskId);
      if (!task) return;
      const domain = domainMap.get(task.domainId);
      if (!domain) return;
      
      const slug = domain.slug;
      if (slug in domainHours) {
        domainHours[slug] += s.durationSeconds / 3600;
      }
    });
    
    const totalHours = Object.values(domainHours).reduce((a, b) => a + b, 0);
    const maxHours = Math.max(...Object.values(domainHours), 1);
    
    data.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date,
      health: (domainHours.health / maxHours) * 100,
      work: (domainHours.work / maxHours) * 100,
      learning: (domainHours.learning / maxHours) * 100,
      volunteering: (domainHours.volunteering / maxHours) * 100,
      totalHours: Math.round(totalHours * 10) / 10,
    });
  }
  
  return data;
}

export interface CompanionEvolutionData {
  name: string;
  species: string;
  color: string;
  level: number;
  currentXp: number;
  nextThreshold: number;
  xpInPeriod: number;
  progress: number;
  xpNeeded: number;
  isActive: boolean;
}

export function getAllCompanionsEvolutionData(
  sessions: FocusSessionItem[],
  tasks: TaskItem[],
  domains: LifeDomainItem[]
): CompanionEvolutionData[] {
  if (domains.length === 0) return [];
  
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const activeDomains = domains.filter(d => d.isActive);
  
  return activeDomains.map(domain => {
    let xpInPeriod = 0;
    sessions.forEach(s => {
      if (!s.taskId) return;
      const task = taskMap.get(s.taskId);
      if (task?.domainId === domain.id) {
        xpInPeriod += s.verifiedXp;
      }
    });
    
    const nextThreshold = domain.skillPets?.[0]?.nextEvolutionThreshold || (domain.level * 1000 + 1000);
    const progress = nextThreshold > 0 ? (domain.currentXp / nextThreshold) * 100 : 0;
    const xpNeeded = Math.max(0, nextThreshold - domain.currentXp);
    
    return {
      name: domain.name,
      species: domain.avatarSpecies || "Vitality Wolf",
      color: domain.accentColor || "#10B981",
      level: domain.level,
      currentXp: domain.currentXp,
      nextThreshold,
      xpInPeriod,
      progress,
      xpNeeded,
      isActive: domain.isActive,
    };
  });
}