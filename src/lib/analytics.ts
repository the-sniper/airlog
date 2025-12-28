import type {
  SessionWithDetails,
  NoteWithDetails,
  NoteCategory,
  Scene,
  Tester,
  PollQuestion,
  PollResponse,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface SceneAnalytics {
  sceneId: string;
  sceneName: string;
  totalNotes: number;
  bugCount: number;
  bugDensity: number; // percentage
  uniqueTesters: number;
  categoryBreakdown: Record<NoteCategory, number>;
}

export interface TemporalAnalytics {
  sessionDuration: number | null; // in minutes
  sessionDurationFormatted: string;
  notesByTimeSegment: { segment: string; count: number; bugs: number }[];
  earlyNotes: number;
  lateNotes: number;
  peakSegment: string | null;
}

export interface ContentQualityMetrics {
  averageNoteLength: number;
  autoClassificationRate: number;
  audioCoverage: number;
  aiSummaryCoverage: number;
  editRate: number;
  totalNotes: number;
}

export interface CategoryInsights {
  bugToFeatureRatio: number | null;
  dominantCategory: NoteCategory;
  concentrationScore: number; // 0-100, higher = more concentrated
  topCategoryShare: number; // 0-100
  categoryByScene: {
    sceneId: string;
    sceneName: string;
    categories: Record<NoteCategory, number>;
  }[];
  totalByCategory: Record<NoteCategory, number>;
}

export interface TrendsAndThemes {
  sentimentIndicator: "positive" | "negative" | "neutral" | "mixed";
  topIssues: { issue: string; count: number }[];
  positiveNotes: number;
  negativeNotes: number;
  mixedNotes: number;
  neutralNotes: number;
  totalNotes: number;
}

export interface TesterEngagement {
  participationRate: number;
  averageNotesPerTester: number;
  testersWithNotes: number;
  totalTesters: number;
  totalNotes: number;
  silentTesters: { id: string; name: string }[];
  topContributors: { id: string; name: string; noteCount: number }[];
}

export interface HistoricalSession {
  id: string;
  name: string;
  build_version: string | null;
  started_at: string | null;
  ended_at: string | null;
  totalNotes: number;
  bugCount: number;
  testerCount: number;
}

export interface HistoricalComparison {
  sessions: HistoricalSession[];
  bugTrend: "improving" | "worsening" | "stable";
  bugChangePercent: number | null;
  averageBugs: number;
}

// ============================================================================
// Scene Analytics
// ============================================================================

export function calculateSceneAnalytics(
  session: SessionWithDetails,
): SceneAnalytics[] {
  const scenes = session.scenes || [];
  const notes = session.notes || [];

  return scenes.map((scene) => {
    const sceneNotes = notes.filter((n) => n.scene_id === scene.id);
    const bugCount = sceneNotes.filter((n) => n.category === "bug").length;
    const uniqueTesters = new Set(sceneNotes.map((n) => n.tester_id)).size;

    const categoryBreakdown: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    sceneNotes.forEach((n) => categoryBreakdown[n.category]++);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      totalNotes: sceneNotes.length,
      bugCount,
      bugDensity:
        sceneNotes.length > 0 ? (bugCount / sceneNotes.length) * 100 : 0,
      uniqueTesters,
      categoryBreakdown,
    };
  });
}

export function getHotspotScenes(
  sceneAnalytics: SceneAnalytics[],
  limit = 3,
): SceneAnalytics[] {
  return [...sceneAnalytics]
    .filter((s) => s.bugCount > 0)
    .sort((a, b) => b.bugCount - a.bugCount)
    .slice(0, limit);
}

export function getSceneCoverage(session: SessionWithDetails): number {
  const scenes = session.scenes || [];
  const notes = session.notes || [];
  if (scenes.length === 0) return 0;

  const scenesWithNotes = new Set(notes.map((n) => n.scene_id));
  return (scenesWithNotes.size / scenes.length) * 100;
}

// ============================================================================
// Temporal Analytics
// ============================================================================

export function calculateTemporalAnalytics(
  session: SessionWithDetails,
): TemporalAnalytics {
  const notes = session.notes || [];

  // Session duration - use first_ended_at for accurate duration (excludes restarts)
  let sessionDuration: number | null = null;
  let sessionDurationFormatted = "N/A";

  // Use first_ended_at to get the original session duration, falling back to ended_at
  const endTime = session.first_ended_at || session.ended_at;

  if (session.started_at && endTime) {
    const start = new Date(session.started_at).getTime();
    const end = new Date(endTime).getTime();
    sessionDuration = Math.round((end - start) / (1000 * 60)); // minutes

    const hours = Math.floor(sessionDuration / 60);
    const mins = sessionDuration % 60;
    sessionDurationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // Notes by time segment (divide session into 4 quarters)
  const notesByTimeSegment: { segment: string; count: number; bugs: number }[] =
    [];
  let earlyNotes = 0;
  let lateNotes = 0;
  let peakSegment: string | null = null;

  if (session.started_at && endTime && notes.length > 0) {
    const start = new Date(session.started_at).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    const quarterDuration = duration / 4;

    const segments = [
      "Q1 (0-25%)",
      "Q2 (25-50%)",
      "Q3 (50-75%)",
      "Q4 (75-100%)",
    ];
    const segmentCounts = segments.map(() => ({ count: 0, bugs: 0 }));

    notes.forEach((note) => {
      const noteTime = new Date(note.created_at).getTime();
      const elapsed = noteTime - start;
      const quarterIndex = Math.min(Math.floor(elapsed / quarterDuration), 3);

      if (quarterIndex >= 0 && quarterIndex < 4) {
        segmentCounts[quarterIndex].count++;
        if (note.category === "bug") {
          segmentCounts[quarterIndex].bugs++;
        }
      }
    });

    segments.forEach((segment, i) => {
      notesByTimeSegment.push({
        segment,
        count: segmentCounts[i].count,
        bugs: segmentCounts[i].bugs,
      });
    });

    // Early vs Late (first half vs second half)
    earlyNotes = segmentCounts[0].count + segmentCounts[1].count;
    lateNotes = segmentCounts[2].count + segmentCounts[3].count;

    // Peak segment
    const maxCount = Math.max(...segmentCounts.map((s) => s.count));
    const peakIndex = segmentCounts.findIndex((s) => s.count === maxCount);
    peakSegment = maxCount > 0 ? segments[peakIndex] : null;
  }

  return {
    sessionDuration,
    sessionDurationFormatted,
    notesByTimeSegment,
    earlyNotes,
    lateNotes,
    peakSegment,
  };
}

// ============================================================================
// Content Quality Metrics
// ============================================================================

export function calculateContentQuality(
  session: SessionWithDetails,
): ContentQualityMetrics {
  const notes = session.notes || [];
  const totalNotes = notes.length;

  if (totalNotes === 0) {
    return {
      averageNoteLength: 0,
      autoClassificationRate: 0,
      audioCoverage: 0,
      aiSummaryCoverage: 0,
      editRate: 0,
      totalNotes: 0,
    };
  }

  // Average note length (word count)
  const totalWords = notes.reduce((sum, note) => {
    const text = note.edited_transcript || note.raw_transcript || "";
    return sum + text.split(/\s+/).filter((w) => w.length > 0).length;
  }, 0);
  const averageNoteLength = Math.round(totalWords / totalNotes);

  // Auto-classification rate
  const autoClassified = notes.filter((n) => n.auto_classified).length;
  const autoClassificationRate = (autoClassified / totalNotes) * 100;

  // Audio coverage
  const withAudio = notes.filter((n) => n.audio_url).length;
  const audioCoverage = (withAudio / totalNotes) * 100;

  // AI Summary coverage
  const withSummary = notes.filter((n) => n.ai_summary).length;
  const aiSummaryCoverage = (withSummary / totalNotes) * 100;

  // Edit rate (notes where edited != raw)
  const edited = notes.filter(
    (n) =>
      n.edited_transcript &&
      n.raw_transcript &&
      n.edited_transcript !== n.raw_transcript,
  ).length;
  const editRate = (edited / totalNotes) * 100;

  return {
    averageNoteLength,
    autoClassificationRate,
    audioCoverage,
    aiSummaryCoverage,
    editRate,
    totalNotes,
  };
}

// ============================================================================
// Category Insights
// ============================================================================

export function calculateCategoryInsights(
  session: SessionWithDetails,
): CategoryInsights {
  const notes = session.notes || [];
  const scenes = session.scenes || [];

  // Total by category
  const totalByCategory: Record<NoteCategory, number> = {
    bug: 0,
    feature: 0,
    ux: 0,
    performance: 0,
    other: 0,
  };
  notes.forEach((n) => totalByCategory[n.category]++);
  const totalNotes = notes.length;

  // Bug to feature ratio
  const bugToFeatureRatio =
    totalByCategory.feature > 0
      ? totalByCategory.bug / totalByCategory.feature
      : null;

  // Dominant category
  const dominantCategory = (
    Object.entries(totalByCategory) as [NoteCategory, number][]
  ).reduce((max, [cat, count]) => (count > max[1] ? [cat, count] : max), [
    "other",
    0,
  ] as [NoteCategory, number])[0];

  // Category by scene
  const categoryByScene = scenes.map((scene) => {
    const sceneNotes = notes.filter((n) => n.scene_id === scene.id);
    const categories: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    sceneNotes.forEach((n) => categories[n.category]++);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      categories,
    };
  });

  // Concentration score (Herfindahl–Hirschman style) and top category share
  let concentrationScore = 0;
  let topCategoryShare = 0;
  if (totalNotes > 0) {
    const shares = (Object.values(totalByCategory) as number[])
      .filter((count) => count > 0)
      .map((count) => count / totalNotes);
    concentrationScore =
      shares.reduce((sum, share) => sum + share * share, 0) * 100;
    topCategoryShare = Math.max(...shares) * 100;
  }

  return {
    bugToFeatureRatio,
    dominantCategory,
    concentrationScore,
    topCategoryShare,
    categoryByScene,
    totalByCategory,
  };
}

// ============================================================================
// Tester Engagement
// ============================================================================

export function calculateTesterEngagement(
  session: SessionWithDetails,
): TesterEngagement {
  const testers = session.testers || [];
  const notes = session.notes || [];

  const noteCounts = new Map<string, number>();
  notes.forEach((note) => {
    noteCounts.set(note.tester_id, (noteCounts.get(note.tester_id) || 0) + 1);
  });

  const testersWithNotes = Array.from(noteCounts.keys()).length;
  const participationRate =
    testers.length > 0 ? (testersWithNotes / testers.length) * 100 : 0;
  const averageNotesPerTester =
    testers.length > 0 ? notes.length / testers.length : 0;

  const formatName = (tester: Tester) => {
    const fullName = [tester.first_name, tester.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || tester.email || "Tester";
  };

  const topContributors = testers
    .map((tester) => ({
      id: tester.id,
      name: formatName(tester),
      noteCount: noteCounts.get(tester.id) || 0,
    }))
    .filter((t) => t.noteCount > 0)
    .sort((a, b) => b.noteCount - a.noteCount)
    .slice(0, 3);

  const silentTesters = testers
    .filter((tester) => !noteCounts.get(tester.id))
    .map((tester) => ({ id: tester.id, name: formatName(tester) }));

  return {
    participationRate,
    averageNotesPerTester,
    testersWithNotes,
    totalTesters: testers.length,
    totalNotes: notes.length,
    silentTesters,
    topContributors,
  };
}

// ============================================================================
// Trends & Themes
// ============================================================================

export function calculateTrendsAndThemes(
  session: SessionWithDetails,
): TrendsAndThemes {
  const notes = session.notes || [];

  const totalNotes = notes.length;

  // Reported issues surfaced by testers
  const issueCounts: Map<string, number> = new Map();
  (session.testers || []).forEach((tester) => {
    (tester.reported_issues || []).forEach((issue) => {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    });
  });

  const topIssues = Array.from(issueCounts.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Sentiment analysis (note-level, keyword-based)
  let positiveNotes = 0;
  let negativeNotes = 0;
  let mixedNotes = 0;
  let neutralNotes = 0;
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "nice",
    "love",
    "works",
    "smooth",
    "easy",
    "intuitive",
  ];
  const negativeWords = [
    "bad",
    "broken",
    "crash",
    "error",
    "bug",
    "issue",
    "problem",
    "fail",
    "confusing",
    "hard",
    "difficult",
    "slow",
    "frustrating",
  ];

  notes.forEach((note) => {
    const text = (
      note.edited_transcript ||
      note.raw_transcript ||
      ""
    ).toLowerCase();
    const hasPositive = positiveWords.some((w) => text.includes(w));
    const hasNegative = negativeWords.some((w) => text.includes(w));

    if (hasPositive && hasNegative) {
      mixedNotes++;
    } else if (hasPositive) {
      positiveNotes++;
    } else if (hasNegative) {
      negativeNotes++;
    } else {
      neutralNotes++;
    }
  });

  let sentimentIndicator: "positive" | "negative" | "neutral" | "mixed" =
    "neutral";
  if (positiveNotes > negativeNotes * 2) {
    sentimentIndicator = "positive";
  } else if (negativeNotes > positiveNotes * 2) {
    sentimentIndicator = "negative";
  } else if (positiveNotes > 0 && negativeNotes > 0) {
    sentimentIndicator = "mixed";
  }

  return {
    sentimentIndicator,
    topIssues,
    positiveNotes,
    negativeNotes,
    mixedNotes,
    neutralNotes,
    totalNotes,
  };
}

// ============================================================================
// Historical Comparison
// ============================================================================

export function calculateHistoricalComparison(
  currentSession: SessionWithDetails,
  pastSessions: HistoricalSession[],
): HistoricalComparison {
  const currentBugs =
    currentSession.notes?.filter((n) => n.category === "bug").length || 0;

  // Include current session in the list for display
  const allSessions: HistoricalSession[] = [
    ...pastSessions,
    {
      id: currentSession.id,
      name: currentSession.name,
      build_version: currentSession.build_version,
      started_at: currentSession.started_at,
      ended_at: currentSession.ended_at,
      totalNotes: currentSession.notes?.length || 0,
      bugCount: currentBugs,
      testerCount: currentSession.testers?.length || 0,
    },
  ].sort((a, b) => {
    const dateA = new Date(a.started_at || a.ended_at || 0).getTime();
    const dateB = new Date(b.started_at || b.ended_at || 0).getTime();
    return dateA - dateB;
  });

  // Calculate trend
  let bugTrend: "improving" | "worsening" | "stable" = "stable";
  let bugChangePercent: number | null = null;

  if (pastSessions.length > 0) {
    const lastSession = pastSessions[pastSessions.length - 1];
    const lastBugs = lastSession.bugCount;

    if (lastBugs > 0) {
      bugChangePercent = ((currentBugs - lastBugs) / lastBugs) * 100;
      if (bugChangePercent < -10) {
        bugTrend = "improving";
      } else if (bugChangePercent > 10) {
        bugTrend = "worsening";
      }
    } else if (currentBugs > 0) {
      bugTrend = "worsening";
      bugChangePercent = 100;
    }
  }

  // Average bugs across all sessions
  const totalBugs = allSessions.reduce((sum, s) => sum + s.bugCount, 0);
  const averageBugs =
    allSessions.length > 0 ? totalBugs / allSessions.length : 0;

  return {
    sessions: allSessions,
    bugTrend,
    bugChangePercent,
    averageBugs,
  };
}

// ============================================================================
// Poll Analytics
// ============================================================================

export function calculatePollCompletionRate(
  pollQuestions: PollQuestion[],
  pollResponses: PollResponse[],
  testers: Tester[],
): {
  questionId: string;
  question: string;
  completionRate: number;
  required: boolean;
}[] {
  return pollQuestions.map((q) => {
    const responses = pollResponses.filter((r) => r.poll_question_id === q.id);
    const completionRate =
      testers.length > 0 ? (responses.length / testers.length) * 100 : 0;
    return {
      questionId: q.id,
      question: q.question,
      completionRate,
      required: q.required,
    };
  });
}

// ============================================================================
// Issue Correlation
// ============================================================================

export function calculateIssueCorrelation(
  testers: Tester[],
  issueOptions: string[],
): { issue1: string; issue2: string; correlation: number }[] {
  const correlations: {
    issue1: string;
    issue2: string;
    correlation: number;
  }[] = [];

  for (let i = 0; i < issueOptions.length; i++) {
    for (let j = i + 1; j < issueOptions.length; j++) {
      const issue1 = issueOptions[i];
      const issue2 = issueOptions[j];

      // Count testers who reported both issues
      const bothCount = testers.filter(
        (t) =>
          t.reported_issues?.includes(issue1) &&
          t.reported_issues?.includes(issue2),
      ).length;

      // Count testers who reported either issue
      const eitherCount = testers.filter(
        (t) =>
          t.reported_issues?.includes(issue1) ||
          t.reported_issues?.includes(issue2),
      ).length;

      const correlation = eitherCount > 0 ? (bothCount / eitherCount) * 100 : 0;

      if (correlation > 0) {
        correlations.push({ issue1, issue2, correlation });
      }
    }
  }

  return correlations.sort((a, b) => b.correlation - a.correlation);
}

// ============================================================================
// Participation Rate (excluding tester comparison)
// ============================================================================

export function calculateParticipationRate(
  session: SessionWithDetails,
): number {
  const testers = session.testers || [];
  const notes = session.notes || [];

  if (testers.length === 0) return 0;

  const testersWithNotes = new Set(notes.map((n) => n.tester_id)).size;
  return (testersWithNotes / testers.length) * 100;
}
