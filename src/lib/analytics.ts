import type { SessionWithDetails, NoteWithDetails, NoteCategory, Scene, Tester, PollQuestion, PollResponse } from "@/types";

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
  categoryByScene: {
    sceneId: string;
    sceneName: string;
    categories: Record<NoteCategory, number>;
  }[];
  totalByCategory: Record<NoteCategory, number>;
}

export interface CrossTesterAgreement {
  commonKeywords: { keyword: string; count: number; testerCount: number }[];
  sharedFindingsRate: number; // percentage of keywords mentioned by 2+ testers
  uniqueKeywords: number;
  sharedKeywords: number;
}

export interface TrendsAndThemes {
  topKeywords: { word: string; count: number }[];
  themes: string[];
  sentimentIndicator: "positive" | "negative" | "neutral" | "mixed";
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
// Stop Words for Keyword Analysis
// ============================================================================

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that",
  "these", "those", "i", "you", "he", "she", "we", "they", "what", "which", "who",
  "whom", "whose", "where", "when", "why", "how", "all", "each", "every", "both",
  "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "also", "now", "here", "there", "then",
  "once", "if", "because", "until", "while", "although", "though", "after", "before",
  "above", "below", "up", "down", "out", "off", "over", "under", "again", "further",
  "into", "through", "during", "about", "against", "between", "without", "being",
  "having", "doing", "said", "says", "like", "get", "got", "going", "goes", "went",
  "think", "know", "see", "come", "came", "make", "made", "take", "took", "want",
  "really", "thing", "things", "something", "anything", "everything", "nothing",
  "someone", "anyone", "everyone", "im", "dont", "doesnt", "didnt", "cant", "wont",
  "youre", "theyre", "were", "hes", "shes", "its", "thats", "whats", "theres"
]);

// ============================================================================
// Scene Analytics
// ============================================================================

export function calculateSceneAnalytics(session: SessionWithDetails): SceneAnalytics[] {
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
      bugDensity: sceneNotes.length > 0 ? (bugCount / sceneNotes.length) * 100 : 0,
      uniqueTesters,
      categoryBreakdown,
    };
  });
}

export function getHotspotScenes(sceneAnalytics: SceneAnalytics[], limit = 3): SceneAnalytics[] {
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

export function calculateTemporalAnalytics(session: SessionWithDetails): TemporalAnalytics {
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
  const notesByTimeSegment: { segment: string; count: number; bugs: number }[] = [];
  let earlyNotes = 0;
  let lateNotes = 0;
  let peakSegment: string | null = null;

  if (session.started_at && endTime && notes.length > 0) {
    const start = new Date(session.started_at).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    const quarterDuration = duration / 4;

    const segments = ["Q1 (0-25%)", "Q2 (25-50%)", "Q3 (50-75%)", "Q4 (75-100%)"];
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

export function calculateContentQuality(session: SessionWithDetails): ContentQualityMetrics {
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
    (n) => n.edited_transcript && n.raw_transcript && n.edited_transcript !== n.raw_transcript
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

export function calculateCategoryInsights(session: SessionWithDetails): CategoryInsights {
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

  // Bug to feature ratio
  const bugToFeatureRatio =
    totalByCategory.feature > 0 ? totalByCategory.bug / totalByCategory.feature : null;

  // Dominant category
  const dominantCategory = (Object.entries(totalByCategory) as [NoteCategory, number][]).reduce(
    (max, [cat, count]) => (count > max[1] ? [cat, count] : max),
    ["other", 0] as [NoteCategory, number]
  )[0];

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

  return {
    bugToFeatureRatio,
    dominantCategory,
    categoryByScene,
    totalByCategory,
  };
}

// ============================================================================
// Cross-Tester Agreement
// ============================================================================

export function calculateCrossTesterAgreement(session: SessionWithDetails): CrossTesterAgreement {
  const notes = session.notes || [];

  // Extract keywords from all notes
  const keywordsByTester: Map<string, Set<string>> = new Map();
  const keywordCounts: Map<string, { count: number; testers: Set<string> }> = new Map();

  notes.forEach((note) => {
    const text = (note.edited_transcript || note.raw_transcript || "").toLowerCase();
    const words = text
      .split(/[\s.,!?;:'"()\[\]{}]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    const uniqueWords = new Set(words);
    
    if (!keywordsByTester.has(note.tester_id)) {
      keywordsByTester.set(note.tester_id, new Set());
    }
    const testerKeywords = keywordsByTester.get(note.tester_id)!;

    uniqueWords.forEach((word) => {
      testerKeywords.add(word);
      
      if (!keywordCounts.has(word)) {
        keywordCounts.set(word, { count: 0, testers: new Set() });
      }
      const entry = keywordCounts.get(word)!;
      entry.count++;
      entry.testers.add(note.tester_id);
    });
  });

  // Sort by tester count (agreement indicator)
  const commonKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      testerCount: data.testers.size,
    }))
    .filter((k) => k.testerCount > 1) // Only keywords mentioned by 2+ testers
    .sort((a, b) => b.testerCount - a.testerCount || b.count - a.count)
    .slice(0, 15);

  const totalKeywords = keywordCounts.size;
  const sharedKeywords = Array.from(keywordCounts.values()).filter(
    (k) => k.testers.size > 1
  ).length;
  const uniqueKeywords = totalKeywords - sharedKeywords;
  const sharedFindingsRate = totalKeywords > 0 ? (sharedKeywords / totalKeywords) * 100 : 0;

  return {
    commonKeywords,
    sharedFindingsRate,
    uniqueKeywords,
    sharedKeywords,
  };
}

// ============================================================================
// Trends & Themes
// ============================================================================

export function calculateTrendsAndThemes(session: SessionWithDetails): TrendsAndThemes {
  const notes = session.notes || [];

  // Extract keywords for word frequency
  const wordCounts: Map<string, number> = new Map();

  notes.forEach((note) => {
    const text = (note.edited_transcript || note.raw_transcript || "").toLowerCase();
    const words = text
      .split(/[\s.,!?;:'"()\[\]{}]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  const topKeywords = Array.from(wordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Extract themes from AI summaries
  const themes: string[] = [];
  
  // Parse session AI summary for themes
  if (session.ai_summary) {
    // Look for common theme indicators
    const themePatterns = [
      /theme[s]?:?\s*([^.]+)/gi,
      /key (?:issue|finding|point)[s]?:?\s*([^.]+)/gi,
      /main (?:concern|problem)[s]?:?\s*([^.]+)/gi,
    ];
    
    themePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(session.ai_summary!)) !== null) {
        if (match[1]) {
          themes.push(match[1].trim());
        }
      }
    });

    // Also extract bold items as potential themes
    const boldPattern = /\*\*([^*]+)\*\*/g;
    let boldMatch;
    while ((boldMatch = boldPattern.exec(session.ai_summary)) !== null) {
      if (boldMatch[1] && boldMatch[1].length < 50 && !boldMatch[1].includes(":")) {
        themes.push(boldMatch[1].trim());
      }
    }
  }

  // Deduplicate themes
  const uniqueThemes = Array.from(new Set(themes)).slice(0, 5);

  // Sentiment analysis (simple keyword-based)
  let positiveCount = 0;
  let negativeCount = 0;
  const positiveWords = ["good", "great", "excellent", "nice", "love", "works", "smooth", "easy", "intuitive"];
  const negativeWords = ["bad", "broken", "crash", "error", "bug", "issue", "problem", "fail", "confusing", "hard", "difficult", "slow", "frustrating"];

  notes.forEach((note) => {
    const text = (note.edited_transcript || note.raw_transcript || "").toLowerCase();
    positiveWords.forEach((w) => {
      if (text.includes(w)) positiveCount++;
    });
    negativeWords.forEach((w) => {
      if (text.includes(w)) negativeCount++;
    });
  });

  let sentimentIndicator: "positive" | "negative" | "neutral" | "mixed" = "neutral";
  if (positiveCount > negativeCount * 2) {
    sentimentIndicator = "positive";
  } else if (negativeCount > positiveCount * 2) {
    sentimentIndicator = "negative";
  } else if (positiveCount > 0 && negativeCount > 0) {
    sentimentIndicator = "mixed";
  }

  return {
    topKeywords,
    themes: uniqueThemes,
    sentimentIndicator,
  };
}

// ============================================================================
// Historical Comparison
// ============================================================================

export function calculateHistoricalComparison(
  currentSession: SessionWithDetails,
  pastSessions: HistoricalSession[]
): HistoricalComparison {
  const currentBugs = currentSession.notes?.filter((n) => n.category === "bug").length || 0;
  
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
  const averageBugs = allSessions.length > 0 ? totalBugs / allSessions.length : 0;

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
  testers: Tester[]
): { questionId: string; question: string; completionRate: number; required: boolean }[] {
  return pollQuestions.map((q) => {
    const responses = pollResponses.filter((r) => r.poll_question_id === q.id);
    const completionRate = testers.length > 0 ? (responses.length / testers.length) * 100 : 0;
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
  issueOptions: string[]
): { issue1: string; issue2: string; correlation: number }[] {
  const correlations: { issue1: string; issue2: string; correlation: number }[] = [];

  for (let i = 0; i < issueOptions.length; i++) {
    for (let j = i + 1; j < issueOptions.length; j++) {
      const issue1 = issueOptions[i];
      const issue2 = issueOptions[j];

      // Count testers who reported both issues
      const bothCount = testers.filter(
        (t) => t.reported_issues?.includes(issue1) && t.reported_issues?.includes(issue2)
      ).length;

      // Count testers who reported either issue
      const eitherCount = testers.filter(
        (t) => t.reported_issues?.includes(issue1) || t.reported_issues?.includes(issue2)
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

export function calculateParticipationRate(session: SessionWithDetails): number {
  const testers = session.testers || [];
  const notes = session.notes || [];
  
  if (testers.length === 0) return 0;
  
  const testersWithNotes = new Set(notes.map((n) => n.tester_id)).size;
  return (testersWithNotes / testers.length) * 100;
}
