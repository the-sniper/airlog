import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SessionWithDetails, NoteWithDetails, NoteCategory, Scene } from "@/types";

// Brand colors
const colors = {
  // Primary brand
  primary: "#5271C0",
  primaryLight: "#95B2F8",
  primaryLightest: "#EEF2FF",
  
  // Text
  text: "#2D3F4E",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  
  // Backgrounds
  white: "#FFFFFF",
  background: "#F8FAFC",
  backgroundAlt: "#F1F5F9",
  
  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  
  // Category colors
  bug: "#DC2626",
  bugBg: "#FEF2F2",
  feature: "#2563EB",
  featureBg: "#EFF6FF",
  ux: "#7C3AED",
  uxBg: "#F5F3FF",
  performance: "#EA580C",
  performanceBg: "#FFF7ED",
  other: "#64748B",
  otherBg: "#F8FAFC",
};

const categoryConfig: Record<NoteCategory, { color: string; bg: string; label: string }> = {
  bug: { color: colors.bug, bg: colors.bugBg, label: "Bug" },
  feature: { color: colors.feature, bg: colors.featureBg, label: "Feature" },
  ux: { color: colors.ux, bg: colors.uxBg, label: "UX" },
  performance: { color: colors.performance, bg: colors.performanceBg, label: "Performance" },
  other: { color: colors.other, bg: colors.otherBg, label: "Other" },
};

const styles = StyleSheet.create({
  // Page base
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.white,
  },

  // Cover page
  coverPage: {
    padding: 0,
    backgroundColor: colors.white,
  },
  coverTop: {
    height: 320,
    backgroundColor: colors.primary,
    padding: 48,
    justifyContent: "flex-end",
  },
  coverBrand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  coverLogoBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  coverLogoText: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
  },
  coverBrandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 2,
  },
  coverReportLabel: {
    fontSize: 11,
    color: colors.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 1.2,
  },
  coverBottom: {
    flex: 1,
    padding: 48,
    justifyContent: "space-between",
  },
  coverMeta: {
    flexDirection: "row",
    gap: 48,
  },
  coverMetaItem: {},
  coverMetaLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverMetaValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "bold",
  },
  coverStats: {
    flexDirection: "row",
    gap: 20,
    marginTop: 40,
  },
  coverStatCard: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  coverStatNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  coverStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  coverStatHighlight: {
    backgroundColor: colors.bugBg,
  },
  coverStatNumberRed: {
    color: colors.bug,
  },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coverFooterText: {
    fontSize: 9,
    color: colors.textMuted,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerLogoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },
  headerBrand: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text,
    letterSpacing: 0.5,
  },
  headerSession: {
    fontSize: 10,
    color: colors.textSecondary,
    maxWidth: 250,
    textAlign: "right",
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },

  // Summary card
  summaryBox: {
    backgroundColor: colors.primaryLightest,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.7,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Category breakdown
  categoryList: {
    gap: 10,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    width: 90,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  categoryBarOuter: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    marginRight: 16,
  },
  categoryBarInner: {
    height: 8,
    borderRadius: 4,
  },
  categoryValue: {
    width: 50,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text,
  },
  categoryPercent: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 4,
  },

  // Table
  table: {
    marginBottom: 24,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeadCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  tableCell: {
    fontSize: 10,
    color: colors.text,
  },
  tableCellMuted: {
    color: colors.textMuted,
  },
  colName: { width: "40%" },
  colTotal: { width: "15%", textAlign: "center" },
  colBug: { width: "15%", textAlign: "center" },
  colFeature: { width: "15%", textAlign: "center" },
  colOther: { width: "15%", textAlign: "center" },

  // Scene page
  sceneTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  sceneMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  sceneBadge: {
    backgroundColor: colors.background,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  sceneBadgeText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  sceneBadgeRed: {
    backgroundColor: colors.bugBg,
  },
  sceneBadgeTextRed: {
    color: colors.bug,
  },
  sceneDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 20,
    lineHeight: 1.6,
  },

  // Note card
  noteCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  noteHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  noteBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.white,
  },
  noteAuto: {
    fontSize: 8,
    color: colors.textMuted,
  },
  noteMeta: {
    alignItems: "flex-end",
  },
  noteTester: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  noteTime: {
    fontSize: 8,
    color: colors.textMuted,
  },
  noteBody: {
    padding: 14,
  },
  noteText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.7,
  },
  noteSummaryBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    color: colors.textSecondary,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  footerPage: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: "bold",
  },

  // Empty
  emptyBox: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

interface SceneData {
  scene: Scene;
  notes: NoteWithDetails[];
  breakdown: Record<NoteCategory, number>;
}

export function SessionReportPDF({ session }: { session: SessionWithDetails }) {
  // Calculate totals
  const breakdown: Record<NoteCategory, number> = { bug: 0, feature: 0, ux: 0, performance: 0, other: 0 };
  session.notes?.forEach((n) => breakdown[n.category]++);
  const total = session.notes?.length || 0;

  // Group by scene
  const sceneData: SceneData[] = (session.scenes || []).map((scene) => {
    const notes = session.notes?.filter((n) => n.scene_id === scene.id) || [];
    const bd: Record<NoteCategory, number> = { bug: 0, feature: 0, ux: 0, performance: 0, other: 0 };
    notes.forEach((n) => bd[n.category]++);
    return { scene, notes, breakdown: bd };
  });

  // Unknown scene
  const unknownNotes = session.notes?.filter((n) => !n.scene_id || !session.scenes?.find((s) => s.id === n.scene_id)) || [];
  if (unknownNotes.length > 0) {
    const bd: Record<NoteCategory, number> = { bug: 0, feature: 0, ux: 0, performance: 0, other: 0 };
    unknownNotes.forEach((n) => bd[n.category]++);
    sceneData.push({
      scene: { id: "unknown", session_id: session.id, name: "Uncategorized", description: null, order_index: 999 },
      notes: unknownNotes,
      breakdown: bd,
    });
  }

  const scenesWithNotes = sceneData.filter((s) => s.notes.length > 0);
  let pageNum = 1;

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTop}>
          <View style={styles.coverBrand}>
            <View style={styles.coverLogoBox}>
              <Text style={styles.coverLogoText}>E</Text>
            </View>
            <Text style={styles.coverBrandName}>ECHO TEST</Text>
          </View>
          <Text style={styles.coverReportLabel}>Session Report</Text>
          <Text style={styles.coverTitle}>{session.name}</Text>
        </View>

        <View style={styles.coverBottom}>
          <View>
            <View style={styles.coverMeta}>
              {session.build_version && (
                <View style={styles.coverMetaItem}>
                  <Text style={styles.coverMetaLabel}>Build</Text>
                  <Text style={styles.coverMetaValue}>{session.build_version}</Text>
                </View>
              )}
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Completed</Text>
                <Text style={styles.coverMetaValue}>{session.ended_at ? formatDate(session.ended_at) : "In Progress"}</Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Testers</Text>
                <Text style={styles.coverMetaValue}>{session.testers?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.coverStats}>
              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatNumber}>{total}</Text>
                <Text style={styles.coverStatLabel}>Total Notes</Text>
              </View>
              <View style={[styles.coverStatCard, styles.coverStatHighlight]}>
                <Text style={[styles.coverStatNumber, styles.coverStatNumberRed]}>{breakdown.bug}</Text>
                <Text style={styles.coverStatLabel}>Bugs Found</Text>
              </View>
              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatNumber}>{breakdown.feature}</Text>
                <Text style={styles.coverStatLabel}>Features</Text>
              </View>
              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatNumber}>{session.scenes?.length || 0}</Text>
                <Text style={styles.coverStatLabel}>Scenes</Text>
              </View>
            </View>
          </View>

          <View style={styles.coverFooter}>
            <Text style={styles.coverFooterText}>Generated {formatDateTime(new Date().toISOString())}</Text>
            <Text style={styles.coverFooterText}>Page {pageNum}</Text>
          </View>
        </View>
      </Page>

      {/* Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoText}>E</Text>
            </View>
            <Text style={styles.headerBrand}>Echo Test</Text>
          </View>
          <Text style={styles.headerSession}>{session.name}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.sectionSubtitle}>Testing session overview and key metrics</Text>
          </View>

          {session.ai_summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>AI Summary</Text>
              <Text style={styles.summaryText}>{session.ai_summary}</Text>
            </View>
          )}

          {session.description && !session.ai_summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Description</Text>
              <Text style={styles.summaryText}>{session.description}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{total}</Text>
              <Text style={styles.statLabel}>Notes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.bug }]}>{breakdown.bug}</Text>
              <Text style={styles.statLabel}>Bugs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.feature }]}>{breakdown.feature}</Text>
              <Text style={styles.statLabel}>Features</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.ux }]}>{breakdown.ux}</Text>
              <Text style={styles.statLabel}>UX</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <Text style={styles.sectionSubtitle}>Distribution of feedback by type</Text>
          </View>

          <View style={styles.categoryList}>
            {(Object.entries(breakdown) as [NoteCategory, number][]).map(([cat, count]) => {
              const cfg = categoryConfig[cat];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <View key={cat} style={styles.categoryItem}>
                  <View style={[styles.categoryBadge, { backgroundColor: cfg.color }]}>
                    <Text style={styles.categoryBadgeText}>{cfg.label}</Text>
                  </View>
                  <View style={styles.categoryBarOuter}>
                    <View style={[styles.categoryBarInner, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                  </View>
                  <View style={styles.categoryValue}>
                    <Text style={styles.categoryCount}>{count}</Text>
                    <Text style={styles.categoryPercent}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Echo Test Report</Text>
          <Text style={styles.footerPage}>{++pageNum}</Text>
        </View>
      </Page>

      {/* Scene Overview */}
      {scenesWithNotes.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLogo}>
                <Text style={styles.headerLogoText}>E</Text>
              </View>
              <Text style={styles.headerBrand}>Echo Test</Text>
            </View>
            <Text style={styles.headerSession}>{session.name}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Scenes Overview</Text>
              <Text style={styles.sectionSubtitle}>Feedback distribution across testing scenes</Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, styles.colName]}>Scene</Text>
                <Text style={[styles.tableHeadCell, styles.colTotal]}>Total</Text>
                <Text style={[styles.tableHeadCell, styles.colBug]}>Bugs</Text>
                <Text style={[styles.tableHeadCell, styles.colFeature]}>Features</Text>
                <Text style={[styles.tableHeadCell, styles.colOther]}>Other</Text>
              </View>
              {scenesWithNotes.map((s, i) => (
                <View key={s.scene.id} style={[styles.tableRow, i === scenesWithNotes.length - 1 && styles.tableRowLast]}>
                  <Text style={[styles.tableCell, styles.colName, { fontWeight: "bold" }]}>{s.scene.name}</Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>{s.notes.length}</Text>
                  <Text style={[styles.tableCell, styles.colBug, s.breakdown.bug > 0 ? { color: colors.bug, fontWeight: "bold" } : styles.tableCellMuted]}>
                    {s.breakdown.bug}
                  </Text>
                  <Text style={[styles.tableCell, styles.colFeature, s.breakdown.feature > 0 ? { color: colors.feature } : styles.tableCellMuted]}>
                    {s.breakdown.feature}
                  </Text>
                  <Text style={[styles.tableCell, styles.colOther, styles.tableCellMuted]}>
                    {s.breakdown.ux + s.breakdown.performance + s.breakdown.other}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Echo Test Report</Text>
            <Text style={styles.footerPage}>{++pageNum}</Text>
          </View>
        </Page>
      )}

      {/* Scene Details */}
      {scenesWithNotes.map((s) => (
        <Page key={s.scene.id} size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLogo}>
                <Text style={styles.headerLogoText}>E</Text>
              </View>
              <Text style={styles.headerBrand}>Echo Test</Text>
            </View>
            <Text style={styles.headerSession}>{session.name}</Text>
          </View>

          <Text style={styles.sceneTitle}>{s.scene.name}</Text>

          <View style={styles.sceneMetaRow}>
            <View style={styles.sceneBadge}>
              <Text style={styles.sceneBadgeText}>{s.notes.length} {s.notes.length === 1 ? "note" : "notes"}</Text>
            </View>
            {s.breakdown.bug > 0 && (
              <View style={[styles.sceneBadge, styles.sceneBadgeRed]}>
                <Text style={[styles.sceneBadgeText, styles.sceneBadgeTextRed]}>{s.breakdown.bug} {s.breakdown.bug === 1 ? "bug" : "bugs"}</Text>
              </View>
            )}
          </View>

          {s.scene.description && <Text style={styles.sceneDesc}>{s.scene.description}</Text>}

          {s.notes.map((note) => {
            const cfg = categoryConfig[note.category];
            return (
              <View key={note.id} style={styles.noteCard}>
                <View style={[styles.noteHeader, { backgroundColor: cfg.bg }]}>
                  <View style={styles.noteHeaderLeft}>
                    <View style={[styles.noteBadge, { backgroundColor: cfg.color }]}>
                      <Text style={styles.noteBadgeText}>{cfg.label}</Text>
                    </View>
                    {note.auto_classified && <Text style={styles.noteAuto}>auto</Text>}
                  </View>
                  <View style={styles.noteMeta}>
                    <Text style={styles.noteTester}>{note.tester?.first_name} {note.tester?.last_name}</Text>
                    <Text style={styles.noteTime}>{formatDateTime(note.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.noteBody}>
                  <Text style={styles.noteText}>{note.edited_transcript || note.raw_transcript || "No transcript"}</Text>
                  {note.ai_summary && (
                    <View style={styles.noteSummaryBox}>
                      <Text style={styles.noteSummaryLabel}>AI Summary</Text>
                      <Text style={styles.noteSummaryText}>{note.ai_summary}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{s.scene.name}</Text>
            <Text style={styles.footerPage}>{++pageNum}</Text>
          </View>
        </Page>
      ))}

      {/* Empty state */}
      {total === 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLogo}>
                <Text style={styles.headerLogoText}>E</Text>
              </View>
              <Text style={styles.headerBrand}>Echo Test</Text>
            </View>
            <Text style={styles.headerSession}>{session.name}</Text>
          </View>

          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No notes were recorded during this session.</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Echo Test Report</Text>
            <Text style={styles.footerPage}>{++pageNum}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
