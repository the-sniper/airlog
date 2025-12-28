// Admin Dashboard Analytics Utilities
// Provides aggregated statistics for the admin dashboard

import type { NoteCategory } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  // Summary counts
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  draftSessions: number;
  totalTesters: number;
  totalNotes: number;

  // Note categories
  notesByCategory: Record<NoteCategory, number>;

  // Session status breakdown (for pie chart)
  sessionsByStatus: {
    status: string;
    count: number;
    color: string;
  }[];

  // Time-series data
  sessionsOverTime: {
    date: string;
    sessions: number;
    notes: number;
    bugs: number;
  }[];

  // Top scenes by feedback
  topScenes: {
    sceneId: string;
    sceneName: string;
    sessionName: string;
    noteCount: number;
    bugCount: number;
  }[];

  // Tester leaderboard
  testerLeaderboard: {
    testerId: string;
    name: string;
    noteCount: number;
    bugCount: number;
  }[];

  // Recent notes (for activity feed)
  recentNotes: {
    id: string;
    transcript: string;
    category: NoteCategory;
    testerName: string;
    sceneName: string;
    sessionName: string;
    createdAt: string;
  }[];

  // Active sessions list (for banner)
  activeSessionsList: {
    id: string;
    name: string;
    build_version?: string;
    started_at: string;
    testerCount: number;
    noteCount: number;
  }[];
}

// ============================================================================
// Color Constants
// ============================================================================

export const CATEGORY_COLORS: Record<NoteCategory, string> = {
  bug: "#fb7088",
  feature: "#6e71f1",
  ux: "#0095c6",
  performance: "#f97316",
  other: "#6b7280",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  active: "#22c55e",
  completed: "#6e71f1",
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the date range based on filter selection
 */
export function getDateRange(filter: "7d" | "30d" | "all"): Date | null {
  if (filter === "all") return null;

  const now = new Date();
  const days = filter === "7d" ? 7 : 30;
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - days);
  pastDate.setHours(0, 0, 0, 0);

  return pastDate;
}

/**
 * Formats a date for display in charts
 */
export function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Groups data by date for time-series charts
 */
export function groupByDate<T extends { created_at: string }>(
  items: T[],
  startDate: Date | null,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  items.forEach((item) => {
    const itemDate = new Date(item.created_at);

    // Skip items before the start date
    if (startDate && itemDate < startDate) return;

    const dateKey = itemDate.toISOString().split("T")[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  return grouped;
}

/**
 * Fills in missing dates in a time series
 */
export function fillDateGaps(
  data: { date: string; [key: string]: number | string }[],
  startDate: Date,
  endDate: Date = new Date(),
): { date: string; [key: string]: number | string }[] {
  const dateMap = new Map(data.map((d) => [d.date, d]));
  const result: { date: string; [key: string]: number | string }[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split("T")[0];
    const existing = dateMap.get(dateKey);

    if (existing) {
      result.push(existing);
    } else {
      // Fill with zeros
      result.push({
        date: dateKey,
        sessions: 0,
        notes: 0,
        bugs: 0,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Truncates text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
