# 📊 Analytics Brainstorm for AirLog Reports

## Based on Your Data Model:

- **Sessions** (with timestamps, status, build version)
- **Scenes** (with descriptions, order)
- **Testers** (with names, email, reported issues)
- **Notes** (with transcripts, categories, timestamps, AI summaries)
- **Poll Questions & Responses** (single/multi-choice)
- **Reported Issues** (custom checkboxes)

---

## 🎯 Tier 1: Easy Wins (Data Already Available)

### Session Overview Metrics

| Metric                        | Description                                |
| ----------------------------- | ------------------------------------------ |
| **Session Duration**          | Time from `started_at` to `ended_at`       |
| **Avg Notes per Tester**      | Total notes ÷ testers count                |
| **Tester Participation Rate** | % of testers who submitted at least 1 note |
| **Auto-Classification Rate**  | % of notes classified by AI vs manual      |

### Tester Engagement

| Metric                              | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| **Top Contributors**                | Testers ranked by note count                |
| **Notes per Tester**                | Bar chart showing individual contributions  |
| **Category Distribution by Tester** | Does Tester A find more bugs than Tester B? |
| **Silent Testers**                  | Testers who joined but submitted 0 notes    |

### Scene Analytics

| Metric                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **Hotspot Scenes**      | Scenes with the most bugs (highlight problem areas) |
| **Engagement by Scene** | Notes per scene, testers who engaged                |
| **Bug Density**         | Bugs ÷ total notes per scene                        |
| **Scene Coverage**      | % of scenes with at least one note                  |

### Temporal Analytics

| Metric                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| **Notes Timeline**     | When were notes submitted during the session |
| **Activity Curve**     | Did testers find more issues early vs. late? |
| **Peak Activity Time** | When were testers most active                |

---

## 📈 Tier 2: Valuable Insights (Requires Minor Calculations)

### Content Quality Metrics

| Metric                      | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| **Avg Note Length**         | Word count of transcripts (short = might lack detail)   |
| **Audio vs Text Notes**     | % with audio recordings vs. text-only                   |
| **Notes with AI Summaries** | % of notes that have been AI-summarized                 |
| **Edit Rate**               | % of notes where `edited_transcript` ≠ `raw_transcript` |

### Poll Response Analytics

| Metric                           | Description                             |
| -------------------------------- | --------------------------------------- |
| **Poll Completion Rate**         | % of testers who answered each poll     |
| **Response Distribution**        | Pie/bar charts for each poll question   |
| **Required Question Compliance** | Did everyone answer required questions? |
| **Scene Poll Summary**           | Aggregate responses grouped by scene    |

### Reported Issues Analytics

| Metric                      | Description                                     |
| --------------------------- | ----------------------------------------------- |
| **Issue Frequency**         | Which custom issues were most commonly reported |
| **Issue Heatmap by Tester** | Who reported what issues                        |
| **Issue Correlation**       | Issues commonly reported together               |

### Category Insights

| Metric                   | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| **Bug-to-Feature Ratio** | Indicates if session was finding problems vs. opportunities |
| **UX vs Performance**    | Are issues more usability or technical?                     |
| **Category by Scene**    | Stacked bar showing category distribution per scene         |

---

## 🔮 Tier 3: Advanced Analytics (May Need AI/Additional Processing)

### Quality & Severity

| Metric                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **Estimated Severity**  | AI-derived severity score from transcript content   |
| **Actionability Score** | How actionable is each note?                        |
| **Duplicate Detection** | Similar notes across testers (indicates real issue) |

### Cross-Tester Agreement

| Metric                        | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| **Issue Consensus**           | How many testers reported similar issues (validates severity) |
| **Unique vs Repeated Issues** | Deduplicated issue count                                      |
| **Tester Agreement Rate**     | Do testers agree on problem scenes?                           |

### Trends & Themes

| Metric                 | Description                                       |
| ---------------------- | ------------------------------------------------- |
| **Word Cloud**         | Common terms across all notes                     |
| **Recurring Themes**   | AI-extracted common themes                        |
| **Sentiment Analysis** | Overall tone of feedback (frustrated vs. pleased) |

### Historical (Cross-Session)

| Metric                          | Description                               |
| ------------------------------- | ----------------------------------------- |
| **Build-over-Build Comparison** | Bug count trend across sessions           |
| **Regression Detection**        | Issues that reappear in new builds        |
| **Tester Reliability**          | Which testers consistently find real bugs |

---

## 🎨 Visual Presentation Ideas

### Charts to Add

1. **Pie Chart** - Category breakdown (you have this, make it visual)
2. **Bar Chart** - Notes per scene (horizontal, sorted by bug count)
3. **Stacked Bar** - Category distribution per scene
4. **Timeline** - Notes over session duration
5. **Heatmap** - Scenes × Categories matrix
6. **Radar Chart** - Tester engagement metrics

### New Report Sections

1. **Executive Summary Card** - 4-5 key KPIs at the top
2. **Problem Areas** - Top 3 most problematic scenes
3. **Tester Leaderboard** - Who contributed most
4. **Poll Results** - Visual breakdowns per question
5. **Key Themes** - AI-extracted from all notes

---

## 🚀 Quick Implementation Recommendations

### Start with these (high value, low effort):

1. **Session Duration** - already have timestamps
2. **Tester Participation Stats** - simple counts
3. **Bug Density by Scene** - highlight problem areas
4. **Poll Response Charts** - you have this data, just need visualization
5. **Top Issues Reported** - aggregate `reported_issues`

### Consider adding to schema later:

- `severity` field on notes
- `sentiment_score` computed from AI
- Session-level analytics cache (precomputed stats)

---

## Implementation Status

### Completed ✅

- [x] Session Duration
- [x] Participation Rate
- [x] Auto-Classification Rate
- [x] Hotspot Scenes
- [x] Bug Density by Scene
- [x] Scene Coverage
- [x] Category Distribution by Scene (Stacked bars)
- [x] Bug-to-Feature Ratio
- [x] Activity Timeline (4 quarters)
- [x] Early vs Late Discovery Pattern
- [x] Content Quality Metrics (avg note length, audio coverage, AI summaries, edit rate)
- [x] Tester Engagement (participation rate, avg notes/tester, top contributors)
- [x] Trends & Themes (sentiment indicator, experience balance, top reported issues)
- [x] Historical Comparison (bug trends across sessions)

### Files Created

- `src/lib/analytics.ts` - All calculation utilities
- `src/components/analytics/analytics-tab.tsx` - Main container
- `src/components/analytics/scene-analytics.tsx` - Scene metrics
- `src/components/analytics/temporal-analytics.tsx` - Time-based metrics
- `src/components/analytics/content-quality.tsx` - Note quality metrics
- `src/components/analytics/category-insights.tsx` - Category analysis
- `src/components/analytics/tester-engagement.tsx` - Participation & contribution analysis
- `src/components/analytics/trends-themes.tsx` - Sentiment, experience balance, and issue highlights
- `src/components/analytics/historical-comparison.tsx` - Cross-session comparison
- `src/app/api/sessions/[id]/historical/route.ts` - Historical data API
- `src/app/api/public/report/[token]/historical/route.ts` - Public historical API

### Modified Files

- `src/app/admin/sessions/[id]/report/page.tsx` - Added Tabs UI
- `src/app/report/[token]/page.tsx` - Added Tabs UI for public
