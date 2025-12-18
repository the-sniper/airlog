import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle } from "@react-pdf/renderer";
import type { SessionWithDetails, NoteWithDetails, NoteCategory, Scene } from "@/types";

// Color palette
const colors = {
  primary: "#10b981",
  primaryDark: "#059669",
  primaryLight: "#d1fae5",
  dark: "#111827",
  gray900: "#1f2937",
  gray700: "#374151",
  gray600: "#4b5563",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  gray50: "#f9fafb",
  white: "#ffffff",
  red: "#ef4444",
  redLight: "#fef2f2",
  blue: "#3b82f6",
  blueLight: "#eff6ff",
  purple: "#8b5cf6",
  purpleLight: "#f5f3ff",
  orange: "#f97316",
  orangeLight: "#fff7ed",
  grayCategory: "#6b7280",
  grayLight: "#f3f4f6",
};

const categoryConfig: Record<NoteCategory, { color: string; bgColor: string; label: string; icon: string }> = {
  bug: { color: colors.red, bgColor: colors.redLight, label: "Bug", icon: "🐛" },
  feature: { color: colors.blue, bgColor: colors.blueLight, label: "Feature Request", icon: "✨" },
  ux: { color: colors.purple, bgColor: colors.purpleLight, label: "UX Feedback", icon: "🎨" },
  performance: { color: colors.orange, bgColor: colors.orangeLight, label: "Performance", icon: "⚡" },
  other: { color: colors.grayCategory, bgColor: colors.grayLight, label: "Other", icon: "📝" },
};

const styles = StyleSheet.create({
  // Cover Page
  coverPage: {
    padding: 0,
    backgroundColor: colors.white,
  },
  coverHeader: {
    backgroundColor: colors.primary,
    height: 200,
    padding: 40,
    position: "relative",
  },
  coverPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 300,
    height: 200,
    opacity: 0.1,
  },
  coverBrand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  coverLogo: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  coverLogoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  coverBrandText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 1,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: colors.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  coverBody: {
    padding: 40,
    flex: 1,
  },
  coverMetaSection: {
    marginBottom: 32,
  },
  coverMetaLabel: {
    fontSize: 10,
    color: colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: "bold",
  },
  coverStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 16,
  },
  coverStatBox: {
    width: "47%",
    padding: 20,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  coverStatValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  coverStatLabel: {
    fontSize: 11,
    color: colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coverFooter: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 20,
  },
  coverFooterText: {
    fontSize: 10,
    color: colors.gray500,
  },

  // Standard Page
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  pageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageHeaderLogo: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pageHeaderLogoText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
  },
  pageHeaderTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
  },
  pageHeaderSession: {
    fontSize: 10,
    color: colors.gray600,
    maxWidth: 300,
  },

  // Section styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.gray600,
    marginBottom: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 24,
  },

  // Summary section
  summaryCard: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 11,
    color: colors.gray700,
    lineHeight: 1.6,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Stats grid
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  statCardAccent: {
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  statCardRed: {
    borderTopWidth: 3,
    borderTopColor: colors.red,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark,
  },
  statNumberRed: {
    color: colors.red,
  },
  statLabelCard: {
    fontSize: 9,
    color: colors.gray600,
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Category breakdown
  categorySection: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  categoryBadge: {
    width: 100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 16,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  categoryBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 12,
  },
  categoryBar: {
    height: 12,
    borderRadius: 6,
  },
  categoryStats: {
    flexDirection: "row",
    alignItems: "center",
    width: 70,
    justifyContent: "flex-end",
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.dark,
    marginRight: 4,
  },
  categoryPercent: {
    fontSize: 10,
    color: colors.gray500,
  },

  // Scene overview table
  tableContainer: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  tableRowLast: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 10,
    color: colors.gray700,
  },
  tableCellBold: {
    fontWeight: "bold",
    color: colors.dark,
  },
  colScene: { width: "35%" },
  colNotes: { width: "15%", textAlign: "center" },
  colBugs: { width: "12%", textAlign: "center" },
  colFeatures: { width: "13%", textAlign: "center" },
  colUX: { width: "12%", textAlign: "center" },
  colOther: { width: "13%", textAlign: "center" },

  // Scene detail page
  scenePageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 8,
  },
  scenePageMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  sceneMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sceneMetaText: {
    fontSize: 10,
    color: colors.gray600,
  },
  sceneDescription: {
    fontSize: 11,
    color: colors.gray600,
    marginBottom: 20,
    fontStyle: "italic",
  },

  // Note card
  noteCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    overflow: "hidden",
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  noteCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  noteBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.white,
  },
  noteAutoTag: {
    fontSize: 8,
    color: colors.gray500,
    fontStyle: "italic",
  },
  noteTester: {
    fontSize: 9,
    color: colors.gray600,
  },
  noteTimestamp: {
    fontSize: 8,
    color: colors.gray500,
  },
  noteCardBody: {
    padding: 12,
  },
  noteText: {
    fontSize: 10,
    color: colors.gray700,
    lineHeight: 1.6,
  },
  noteSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  noteSummaryLabel: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteSummaryText: {
    fontSize: 9,
    color: colors.gray600,
    fontStyle: "italic",
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 8,
    color: colors.gray500,
    fontWeight: "bold",
  },
  footerDivider: {
    width: 1,
    height: 10,
    backgroundColor: colors.gray300,
    marginHorizontal: 8,
  },
  footerSession: {
    fontSize: 8,
    color: colors.gray400,
    maxWidth: 200,
  },
  footerPage: {
    fontSize: 9,
    color: colors.gray500,
  },

  // Empty state
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 12,
  },
});

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

interface SceneStats {
  scene: Scene;
  notes: NoteWithDetails[];
  categoryBreakdown: Record<NoteCategory, number>;
}

export function SessionReportPDF({ session }: { session: SessionWithDetails }) {
  const categoryBreakdown: Record<NoteCategory, number> = {
    bug: 0,
    feature: 0,
    ux: 0,
    performance: 0,
    other: 0,
  };

  session.notes?.forEach((note) => {
    categoryBreakdown[note.category]++;
  });

  const totalNotes = session.notes?.length || 0;

  // Group notes by scene with stats
  const sceneStats: SceneStats[] = (session.scenes || []).map((scene) => {
    const sceneNotes = session.notes?.filter((n) => n.scene_id === scene.id) || [];
    const sceneCategoryBreakdown: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    sceneNotes.forEach((note) => {
      sceneCategoryBreakdown[note.category]++;
    });
    return {
      scene,
      notes: sceneNotes,
      categoryBreakdown: sceneCategoryBreakdown,
    };
  });

  // Add "Unknown" scene for notes without a scene
  const unknownNotes = session.notes?.filter((n) => !n.scene_id || !session.scenes?.find((s) => s.id === n.scene_id)) || [];
  if (unknownNotes.length > 0) {
    const unknownCategoryBreakdown: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    unknownNotes.forEach((note) => {
      unknownCategoryBreakdown[note.category]++;
    });
    sceneStats.push({
      scene: { id: "unknown", session_id: session.id, name: "Uncategorized", description: null, order_index: 999 },
      notes: unknownNotes,
      categoryBreakdown: unknownCategoryBreakdown,
    });
  }

  const scenesWithNotes = sceneStats.filter((s) => s.notes.length > 0);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <View style={styles.coverBrand}>
            <View style={styles.coverLogo}>
              <Text style={styles.coverLogoText}>E</Text>
            </View>
            <Text style={styles.coverBrandText}>ECHO TEST</Text>
          </View>
          <Text style={styles.coverSubtitle}>Testing Session Report</Text>
          <Text style={styles.coverTitle}>{session.name}</Text>
        </View>

        <View style={styles.coverBody}>
          {session.description && (
            <View style={styles.coverMetaSection}>
              <Text style={styles.coverMetaLabel}>Description</Text>
              <Text style={styles.coverMetaValue}>{session.description}</Text>
            </View>
          )}

          {session.build_version && (
            <View style={styles.coverMetaSection}>
              <Text style={styles.coverMetaLabel}>Build Version</Text>
              <Text style={styles.coverMetaValue}>{session.build_version}</Text>
            </View>
          )}

          <View style={styles.coverMetaSection}>
            <Text style={styles.coverMetaLabel}>Session Completed</Text>
            <Text style={styles.coverMetaValue}>
              {session.ended_at ? formatDate(session.ended_at) : "In Progress"}
            </Text>
          </View>

          <View style={styles.coverStatsGrid}>
            <View style={styles.coverStatBox}>
              <Text style={styles.coverStatValue}>{totalNotes}</Text>
              <Text style={styles.coverStatLabel}>Total Notes</Text>
            </View>
            <View style={[styles.coverStatBox, { borderLeftColor: colors.red }]}>
              <Text style={[styles.coverStatValue, { color: colors.red }]}>{categoryBreakdown.bug}</Text>
              <Text style={styles.coverStatLabel}>Bugs Found</Text>
            </View>
            <View style={[styles.coverStatBox, { borderLeftColor: colors.blue }]}>
              <Text style={styles.coverStatValue}>{session.testers?.length || 0}</Text>
              <Text style={styles.coverStatLabel}>Testers</Text>
            </View>
            <View style={[styles.coverStatBox, { borderLeftColor: colors.purple }]}>
              <Text style={styles.coverStatValue}>{session.scenes?.length || 0}</Text>
              <Text style={styles.coverStatLabel}>Scenes Tested</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            Generated on {formatDateTime(new Date().toISOString())}
          </Text>
          <Text style={styles.coverFooterText}>Page 1</Text>
        </View>
      </Page>

      {/* Executive Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <View style={styles.pageHeaderLogo}>
              <Text style={styles.pageHeaderLogoText}>E</Text>
            </View>
            <Text style={styles.pageHeaderTitle}>Echo Test</Text>
          </View>
          <Text style={styles.pageHeaderSession}>{session.name}</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.sectionSubtitle}>Overview of testing session results and key findings</Text>

        {/* AI Summary if available */}
        {session.ai_summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>AI-Generated Summary</Text>
            <Text style={styles.summaryText}>{session.ai_summary}</Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statNumber}>{totalNotes}</Text>
            <Text style={styles.statLabelCard}>Total Notes</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRed]}>
            <Text style={[styles.statNumber, styles.statNumberRed]}>{categoryBreakdown.bug}</Text>
            <Text style={styles.statLabelCard}>Bugs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{categoryBreakdown.feature}</Text>
            <Text style={styles.statLabelCard}>Features</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{categoryBreakdown.ux}</Text>
            <Text style={styles.statLabelCard}>UX Issues</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Feedback by Category</Text>
        <Text style={styles.sectionSubtitle}>Distribution of feedback across different categories</Text>

        <View style={styles.categorySection}>
          {(Object.entries(categoryBreakdown) as [NoteCategory, number][]).map(([category, count]) => {
            const config = categoryConfig[category];
            const percentage = totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0;
            return (
              <View key={category} style={styles.categoryRow}>
                <View style={[styles.categoryBadge, { backgroundColor: config.color }]}>
                  <Text style={styles.categoryBadgeText}>{config.label}</Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <View
                    style={[
                      styles.categoryBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryCount}>{count}</Text>
                  <Text style={styles.categoryPercent}>({percentage}%)</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerBrand}>Echo Test Report</Text>
            <View style={styles.footerDivider} />
            <Text style={styles.footerSession}>{session.name}</Text>
          </View>
          <Text style={styles.footerPage}>Page 2</Text>
        </View>
      </Page>

      {/* Scene Overview Page */}
      {scenesWithNotes.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <View style={styles.pageHeaderLogo}>
                <Text style={styles.pageHeaderLogoText}>E</Text>
              </View>
              <Text style={styles.pageHeaderTitle}>Echo Test</Text>
            </View>
            <Text style={styles.pageHeaderSession}>{session.name}</Text>
          </View>

          <Text style={styles.sectionTitle}>Scene Overview</Text>
          <Text style={styles.sectionSubtitle}>Breakdown of feedback by testing scene</Text>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colScene]}>Scene</Text>
              <Text style={[styles.tableHeaderCell, styles.colNotes]}>Notes</Text>
              <Text style={[styles.tableHeaderCell, styles.colBugs]}>Bugs</Text>
              <Text style={[styles.tableHeaderCell, styles.colFeatures]}>Features</Text>
              <Text style={[styles.tableHeaderCell, styles.colUX]}>UX</Text>
              <Text style={[styles.tableHeaderCell, styles.colOther]}>Other</Text>
            </View>
            {scenesWithNotes.map((item, index) => (
              <View
                key={item.scene.id}
                style={[
                  styles.tableRow,
                  index === scenesWithNotes.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCellBold, styles.colScene]}>
                  {item.scene.name}
                </Text>
                <Text style={[styles.tableCell, styles.colNotes]}>{item.notes.length}</Text>
                <Text style={[styles.tableCell, styles.colBugs, { color: item.categoryBreakdown.bug > 0 ? colors.red : colors.gray400 }]}>
                  {item.categoryBreakdown.bug}
                </Text>
                <Text style={[styles.tableCell, styles.colFeatures, { color: item.categoryBreakdown.feature > 0 ? colors.blue : colors.gray400 }]}>
                  {item.categoryBreakdown.feature}
                </Text>
                <Text style={[styles.tableCell, styles.colUX, { color: item.categoryBreakdown.ux > 0 ? colors.purple : colors.gray400 }]}>
                  {item.categoryBreakdown.ux}
                </Text>
                <Text style={[styles.tableCell, styles.colOther]}>
                  {item.categoryBreakdown.performance + item.categoryBreakdown.other}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerBrand}>Echo Test Report</Text>
              <View style={styles.footerDivider} />
              <Text style={styles.footerSession}>{session.name}</Text>
            </View>
            <Text style={styles.footerPage}>Page 3</Text>
          </View>
        </Page>
      )}

      {/* Scene Detail Pages */}
      {scenesWithNotes.map((sceneData, sceneIndex) => (
        <Page key={sceneData.scene.id} size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <View style={styles.pageHeaderLogo}>
                <Text style={styles.pageHeaderLogoText}>E</Text>
              </View>
              <Text style={styles.pageHeaderTitle}>Echo Test</Text>
            </View>
            <Text style={styles.pageHeaderSession}>{session.name}</Text>
          </View>

          <Text style={styles.scenePageTitle}>{sceneData.scene.name}</Text>

          <View style={styles.scenePageMeta}>
            <View style={styles.sceneMetaBadge}>
              <Text style={styles.sceneMetaText}>{sceneData.notes.length} notes</Text>
            </View>
            {sceneData.categoryBreakdown.bug > 0 && (
              <View style={[styles.sceneMetaBadge, { backgroundColor: colors.redLight }]}>
                <Text style={[styles.sceneMetaText, { color: colors.red }]}>
                  {sceneData.categoryBreakdown.bug} bugs
                </Text>
              </View>
            )}
          </View>

          {sceneData.scene.description && (
            <Text style={styles.sceneDescription}>{sceneData.scene.description}</Text>
          )}

          {sceneData.notes.map((note) => {
            const config = categoryConfig[note.category];
            return (
              <View key={note.id} style={styles.noteCard}>
                <View style={[styles.noteCardHeader, { backgroundColor: config.bgColor }]}>
                  <View style={styles.noteCardHeaderLeft}>
                    <View style={[styles.noteBadge, { backgroundColor: config.color }]}>
                      <Text style={styles.noteBadgeText}>{config.label}</Text>
                    </View>
                    {note.auto_classified && <Text style={styles.noteAutoTag}>auto-classified</Text>}
                  </View>
                  <View>
                    <Text style={styles.noteTester}>
                      {note.tester?.first_name} {note.tester?.last_name}
                    </Text>
                    <Text style={styles.noteTimestamp}>{formatDateTime(note.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.noteCardBody}>
                  <Text style={styles.noteText}>
                    {note.edited_transcript || note.raw_transcript || "No transcript available"}
                  </Text>
                  {note.ai_summary && (
                    <View style={styles.noteSummary}>
                      <Text style={styles.noteSummaryLabel}>AI Summary</Text>
                      <Text style={styles.noteSummaryText}>{note.ai_summary}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerBrand}>Echo Test Report</Text>
              <View style={styles.footerDivider} />
              <Text style={styles.footerSession}>{sceneData.scene.name}</Text>
            </View>
            <Text style={styles.footerPage}>Page {4 + sceneIndex}</Text>
          </View>
        </Page>
      ))}

      {/* Empty state if no notes */}
      {totalNotes === 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <View style={styles.pageHeaderLogo}>
                <Text style={styles.pageHeaderLogoText}>E</Text>
              </View>
              <Text style={styles.pageHeaderTitle}>Echo Test</Text>
            </View>
            <Text style={styles.pageHeaderSession}>{session.name}</Text>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No notes were recorded during this session.</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerBrand}>Echo Test Report</Text>
              <View style={styles.footerDivider} />
              <Text style={styles.footerSession}>{session.name}</Text>
            </View>
            <Text style={styles.footerPage}>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
