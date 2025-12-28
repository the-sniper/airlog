# Voice-Based Testing Notes Platform

## Overview

A session-based, voice-first testing notes platform designed to capture unbiased tester feedback, automatically structure it, and generate actionable reports.

The system allows multiple testers to record spoken feedback during testing sessions, isolates feedback during the session to prevent bias, intelligently groups notes by scene and intent, and produces a polished, shareable report at the end.

---

## Core Goals

- Make note-taking effortless during testing
- Remove tester bias and groupthink
- Preserve raw feedback while producing structured insights
- Generate reports that are immediately useful to product and engineering teams

---

## Key Roles

### Admin

- Creates and manages test sessions
- Defines scenes and session metadata
- Controls session start and end
- Generates reports and exports
- Manages integrations

### Tester

- Joins active sessions
- Selects assigned scene
- Records voice notes
- Reviews and edits transcriptions
- Cannot view others’ feedback until session ends

---

## Session Lifecycle

### 1. Session Creation (Admin)

- Session name
- Date and time
- Build or version identifier
- Defined scenes (Scene A, Scene B, etc.)
- Optional visibility lock until session end

### 2. Session Participation (Testers)

- Join via invite link or authentication
- Select the scene being tested
- Begin recording voice notes

### 3. Voice Note Capture

Each note is a discrete entry.

Controls:

- Record
- Pause
- Resume
- Stop

Optional prompt at start:

- Bug
- Feature
- UX feedback
- Let the system auto-detect

---

## Transcription System

### Speech to Text

- Automatic transcription per recording
- Confidence scoring per word or segment
- Audio retained as source of truth

### Editable Transcripts

- Users can edit transcribed text
- Two versions retained:
  - Raw transcript (immutable)
  - Edited transcript (used for processing)

- Low-confidence words visually highlighted
- Optional redaction of sensitive information

---

## Classification and Tagging

Each note is automatically tagged with:

- Scene
- User
- Timestamp
- Category (Bug, Feature, UX, Performance, Other)
- Classification source (Auto or User-Declared)

### Auto-Classification Heuristics

- Keywords and semantic cues used to infer category
- Ambiguous notes flagged instead of forced

---

## Bias Prevention

- Testers cannot see other feedback during an active session
- Feedback is revealed only after admin ends the session
- Optional anonymized reporting

---

## Report Generation

Triggered automatically when session ends.

### Report Contents

#### High-Level Summary

- Total notes recorded
- Category breakdown
- Scene-wise distribution

#### Scene Breakdown

For each scene:

- Grouped issues and feedback clusters
- Recurring themes
- Direct quotes with timestamps and user tags

#### Confidence and Trends

- Frequency of similar issues
- Severity indicators

### Export Options

- Downloadable PDF
- Clean, executive-friendly layout
- Optional anonymized version

---

## History and Replay

- Persistent session history
- Filter by project, date, build, or tester
- Searchable transcripts
- Audio playback synced with text

---

## Integrations

### Confluence (Later Phase)

- Map session to Space and Parent Page
- Auto-create pages at session end
- Optional child pages per scene
- Structured markdown to Confluence format

### Future Integrations

- Jira
- Linear
- GitHub Issues
- Slack notifications

---

## Advanced Features

### Actionability

- One-click convert note to ticket
- Duplicate detection across sessions

### Testing Rigor

- Admin-defined test prompts per scene
- Blind testing modes

### Voice Enhancements

- Spoken hotwords, e.g., "mark this important"
- Moment bookmarks
- Post-note severity rating

### Reporting Enhancements

- Cross-session trend analysis
- Scene and category heatmaps

### Privacy and Trust

- Anonymized tester views
- Admin-only identity resolution
- Redaction tools

---

## Technical Architecture (Suggested)

### Frontend

- Mobile-first
- React Native or Expo
- Web dashboard for admins

### Backend

- Node.js or FastAPI
- REST or GraphQL API

### Speech to Text

- Open-source Whisper (self-hosted)
- Optional hosted STT APIs for MVP

### NLP and Tagging

- Lightweight rules plus LLM classification

### Storage

- PostgreSQL for structured data
- Object storage for audio

### Reporting

- Server-side PDF generation
- Markdown-based templates

---

## Why This Matters

Most testing feedback is lost, biased, or poorly summarized. This system captures raw intent, removes social influence, and converts spoken chaos into structured insight.

It turns testing feedback from an afterthought into a reliable signal.

---

## Future Vision

- Multi-project dashboards
- Predictive issue surfacing
- Voice analytics across teams
- Enterprise-grade audit and compliance features
