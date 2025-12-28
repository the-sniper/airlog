# AirLog - Implementation Scope

This document details what's included in the MVP, what's partially implemented, and what's deferred to future phases - mapped against the [project description](./project_desc.md).

---

## MVP Coverage Summary

| Category                     | Implemented | Partial | Not Done | Coverage |
| ---------------------------- | ----------- | ------- | -------- | -------- |
| **Core Goals**               | 4           | 0       | 0        | **100%** |
| **Session Lifecycle**        | 7           | 0       | 0        | **100%** |
| **Voice Note Capture**       | 5           | 0       | 0        | **100%** |
| **Transcription System**     | 6           | 0       | 3        | **67%**  |
| **Classification & Tagging** | 6           | 1       | 0        | **93%**  |
| **Bias Prevention**          | 2           | 0       | 1        | **67%**  |
| **Report Generation**        | 6           | 0       | 5        | **55%**  |
| **History & Replay**         | 1           | 0       | 3        | **25%**  |
| **Integrations**             | 0           | 0       | 5        | **0%**   |
| **Advanced Features**        | 0           | 1       | 11       | **4%**   |
| **TOTAL**                    | **37**      | **2**   | **28**   | **57%**  |

> **MVP Focus**: Core functionality (session management, voice recording, transcription, basic reporting) is fully implemented. Advanced features and integrations are deferred to future phases.

---

## Core Goals Alignment

| Goal                        | Status  | Implementation                             |
| --------------------------- | ------- | ------------------------------------------ |
| Make note-taking effortless | ✅ Done | Voice recording with one-click start/stop  |
| Remove tester bias          | ✅ Done | Testers isolated during active sessions    |
| Preserve raw feedback       | ✅ Done | Raw + edited transcripts stored separately |
| Generate actionable reports | ✅ Done | PDF export with category breakdown         |

---

## MVP Features (Implemented)

### 1. Session Management

| Feature                                 | Status | Details                           |
| --------------------------------------- | ------ | --------------------------------- |
| Session name                            | ✅     | Required field on creation        |
| Build/version identifier                | ✅     | Optional field                    |
| Defined scenes                          | ✅     | Multiple scenes per session       |
| Session status (draft/active/completed) | ✅     | State machine with admin controls |
| Start/end session                       | ✅     | Admin-only actions                |
| Timestamps (created, started, ended)    | ✅     | Automatic tracking                |

### 2. Tester Management

| Feature                      | Status | Details                 |
| ---------------------------- | ------ | ----------------------- |
| Invite link generation       | ✅     | Unique token per tester |
| Join via invite link         | ✅     | `/join/[token]` route   |
| Tester name capture          | ✅     | Displayed in admin view |
| Multiple testers per session | ✅     | No limit enforced       |

### 3. Voice Note Capture

| Feature                | Status | Details                                  |
| ---------------------- | ------ | ---------------------------------------- |
| Record audio           | ✅     | MediaRecorder API (WebM format)          |
| Pause recording        | ✅     | Pauses MediaRecorder, shows paused state |
| Resume recording       | ✅     | Resumes from paused state                |
| Stop recording         | ✅     | Creates note immediately                 |
| Cancel recording       | ✅     | Discards current recording               |
| Recording timer        | ✅     | Shows elapsed time during recording      |
| Scene selection        | ✅     | Dropdown per recording                   |
| Category pre-selection | ✅     | Manual category or "auto-detect" option  |
| Audio storage          | ✅     | Supabase Storage bucket                  |
| Audio URL in note      | ✅     | Linked to each note                      |

**Not Implemented:**

- Real audio waveform visualization (animated bars shown, but not actual waveform)

### 4. Transcription System

| Feature                  | Status | Details                                 |
| ------------------------ | ------ | --------------------------------------- |
| Automatic transcription  | ✅     | Self-hosted Whisper via Docker          |
| Raw transcript stored    | ✅     | Immutable `raw_transcript` field        |
| Edited transcript        | ✅     | Mutable `edited_transcript` field       |
| Inline editing           | ✅     | Testers can edit their transcriptions   |
| View original transcript | ✅     | Collapsible "Show original" when edited |
| Audio playback           | ✅     | Play/Pause buttons in notes list        |

**Not Implemented:**

- Confidence scoring per word/segment
- Low-confidence word highlighting
- Audio playback synced with text (highlighting words as played)
- Sensitive information redaction tools

### 5. Classification & Tagging

| Feature                        | Status | Details                                       |
| ------------------------------ | ------ | --------------------------------------------- |
| Scene association              | ✅     | Foreign key to scenes table                   |
| User/tester association        | ✅     | Foreign key to testers table                  |
| Timestamp                      | ✅     | `created_at` field                            |
| Category tags                  | ✅     | Bug, Feature, UX, Performance, Other          |
| Auto-classification            | ✅     | Keyword/semantic analysis via `/api/classify` |
| Classification source tracking | ✅     | `auto_classified` boolean field               |
| Manual category override       | ✅     | Dropdown in notes list                        |

### 6. Bias Prevention

| Feature                           | Status | Details                                    |
| --------------------------------- | ------ | ------------------------------------------ |
| Testers see only own notes        | ✅     | Filtered by `tester_id` in active sessions |
| Notes revealed after session ends | ✅     | Admin report shows all notes               |
| Session status gating             | ✅     | Draft sessions block tester access         |

**Not Implemented:**

- Anonymized tester views
- Admin-only identity resolution

### 7. Report Generation

| Feature                 | Status | Details                                 |
| ----------------------- | ------ | --------------------------------------- |
| Total notes count       | ✅     | Summary statistic                       |
| Category breakdown      | ✅     | Bug/Feature/UX/Performance/Other counts |
| Scene-wise distribution | ✅     | Notes grouped by scene                  |
| Direct quotes           | ✅     | Edited transcripts displayed            |
| Tester attribution      | ✅     | Tester name shown per note              |
| PDF export              | ✅     | `@react-pdf/renderer`                   |
| JSON API                | ✅     | `/api/sessions/[id]/report`             |

**Not Implemented:**

- Recurring theme detection
- Severity indicators
- Frequency analysis of similar issues
- Anonymized export version
- Confidence/trend metrics

---

## Technical Architecture

### Frontend

| Component | Implementation            |
| --------- | ------------------------- |
| Framework | Next.js 14 (App Router)   |
| Language  | TypeScript                |
| Styling   | Tailwind CSS + shadcn/ui  |
| State     | React hooks (local state) |
| Forms     | Native React forms        |

### Backend

| Component | Implementation                |
| --------- | ----------------------------- |
| API       | Next.js API Routes            |
| Database  | Supabase (PostgreSQL)         |
| Storage   | Supabase Storage              |
| Auth      | Invite-link tokens (no OAuth) |

### Speech-to-Text

| Component  | Implementation               |
| ---------- | ---------------------------- |
| Engine     | OpenAI Whisper               |
| Deployment | Self-hosted Docker container |
| Model      | Base model (74M params)      |
| API        | Flask REST endpoint          |

### Database Schema

| Table      | Purpose                              |
| ---------- | ------------------------------------ |
| `sessions` | Session metadata, status, timestamps |
| `scenes`   | Tasks/scenes within sessions         |
| `testers`  | Tester info with invite tokens       |
| `notes`    | Transcribed feedback with categories |

---

## User Flows

### Admin Flow

```
1. Create Session → Add name, build version, scenes
2. Add Testers → Generate invite links
3. Share Links → Send to testers
4. Start Session → Testers can now record
5. Monitor → View incoming notes (real-time)
6. End Session → Lock recording, reveal all notes
7. View Report → Summary + PDF download
```

### Tester Flow

```
1. Open Invite Link → `/join/[token]`
2. Wait for Session → Shows "waiting" if draft
3. Select Scene → Dropdown of available scenes
4. Record Note → Click mic, speak, stop
5. Review Transcript → Edit if needed
6. Repeat → Record more notes
7. Done → Session ends, feedback revealed
```

---

## Deferred to Future Phases

### Phase 2: Enhanced Recording

- [x] Pause/Resume recording controls ✅ (implemented)
- [x] Recording timer display ✅ (implemented)
- [x] Audio playback in notes list ✅ (implemented)
- [ ] Real audio waveform visualization
- [ ] Spoken hotwords ("mark important")
- [ ] Moment bookmarks
- [ ] Post-note severity rating (1-5)

### Phase 3: Advanced Transcription

- [ ] Word-level confidence scoring
- [ ] Low-confidence word highlighting
- [ ] Audio playback synced with transcript
- [ ] Sensitive info redaction tools
- [ ] Speaker diarization (multiple speakers)

### Phase 4: Smart Analysis

- [ ] Recurring theme detection (NLP clustering)
- [ ] Duplicate detection across sessions
- [ ] Severity indicators (auto-inferred)
- [ ] Cross-session trend analysis
- [ ] Scene/category heatmaps

### Phase 5: Integrations

- [ ] Confluence export (Space/Page mapping)
- [ ] Jira ticket creation
- [ ] Linear issue sync
- [ ] GitHub Issues export
- [ ] Slack notifications

### Phase 6: Enterprise Features

- [ ] Full OAuth authentication
- [ ] Team/organization management
- [ ] Multi-project dashboards
- [ ] Anonymized tester views
- [ ] Admin-only identity resolution
- [ ] Audit logs
- [ ] Role-based access control

### Phase 7: Mobile

- [ ] React Native app
- [ ] Offline recording support
- [ ] Push notifications
- [ ] Background audio upload

---

## Gap Analysis vs Project Description

### Session Lifecycle (from project_desc.md)

| Requirement                       | Status | Notes                                  |
| --------------------------------- | ------ | -------------------------------------- |
| Session name                      | ✅     | Implemented                            |
| Date and time                     | ✅     | Uses `created_at` timestamp            |
| Build/version identifier          | ✅     | Optional field                         |
| Defined scenes                    | ✅     | Multiple scenes with order             |
| Visibility lock until session end | ✅     | Testers isolated during active session |
| Join via invite link              | ✅     | Unique token per tester                |
| Select scene being tested         | ✅     | Dropdown before recording              |

### Voice Note Capture (from project_desc.md)

| Requirement                           | Status | Notes                              |
| ------------------------------------- | ------ | ---------------------------------- |
| Record                                | ✅     | MediaRecorder API                  |
| Pause                                 | ✅     | Implemented                        |
| Resume                                | ✅     | Implemented                        |
| Stop                                  | ✅     | Implemented                        |
| Optional prompt (Bug/Feature/UX/auto) | ✅     | Category dropdown with auto-detect |

### Transcription System (from project_desc.md)

| Requirement                       | Status | Notes                                  |
| --------------------------------- | ------ | -------------------------------------- |
| Automatic transcription           | ✅     | Whisper integration                    |
| Confidence scoring per word       | ❌     | Not supported by current Whisper setup |
| Audio retained as source of truth | ✅     | Stored in Supabase Storage             |
| Editable transcripts              | ✅     | Inline editing in notes list           |
| Raw transcript (immutable)        | ✅     | `raw_transcript` field                 |
| Edited transcript                 | ✅     | `edited_transcript` field              |
| Low-confidence words highlighted  | ❌     | Requires confidence scoring first      |
| Redaction of sensitive info       | ❌     | Not implemented                        |

### Classification & Tagging (from project_desc.md)

| Requirement                          | Status | Notes                                          |
| ------------------------------------ | ------ | ---------------------------------------------- |
| Scene tag                            | ✅     | Foreign key relationship                       |
| User tag                             | ✅     | Foreign key relationship                       |
| Timestamp                            | ✅     | `created_at` field                             |
| Category (Bug/Feature/UX/Perf/Other) | ✅     | ENUM type in database                          |
| Classification source (Auto/User)    | ✅     | `auto_classified` boolean                      |
| Keyword/semantic classification      | ✅     | Keyword matching in `/api/classify`            |
| Ambiguous notes flagged              | ⚠️     | Returns low confidence score but not displayed |

### Bias Prevention (from project_desc.md)

| Requirement                        | Status | Notes                   |
| ---------------------------------- | ------ | ----------------------- |
| Testers can't see others' feedback | ✅     | Filtered by `tester_id` |
| Revealed after session ends        | ✅     | Admin report shows all  |
| Anonymized reporting               | ❌     | Not implemented         |

### Report Generation (from project_desc.md)

| Requirement                      | Status | Notes                  |
| -------------------------------- | ------ | ---------------------- |
| Total notes recorded             | ✅     | Summary stat           |
| Category breakdown               | ✅     | Bar chart with counts  |
| Scene-wise distribution          | ✅     | Grouped by scene       |
| Grouped issues/feedback clusters | ❌     | No NLP clustering      |
| Recurring themes                 | ❌     | Requires NLP           |
| Direct quotes with timestamps    | ✅     | Transcript + timestamp |
| User tags                        | ✅     | Tester name shown      |
| Frequency of similar issues      | ❌     | No duplicate detection |
| Severity indicators              | ❌     | Not implemented        |
| Downloadable PDF                 | ✅     | `@react-pdf/renderer`  |
| Anonymized version               | ❌     | Not implemented        |

### History & Replay (from project_desc.md)

| Requirement                         | Status | Notes                       |
| ----------------------------------- | ------ | --------------------------- |
| Persistent session history          | ✅     | Database storage            |
| Filter by project/date/build/tester | ❌     | Basic list only             |
| Searchable transcripts              | ❌     | Not implemented             |
| Audio playback synced with text     | ❌     | Play button exists, no sync |

### Integrations (from project_desc.md)

| Requirement         | Status | Notes    |
| ------------------- | ------ | -------- |
| Confluence          | ❌     | Deferred |
| Jira                | ❌     | Deferred |
| Linear              | ❌     | Deferred |
| GitHub Issues       | ❌     | Deferred |
| Slack notifications | ❌     | Deferred |

### Advanced Features (from project_desc.md)

| Requirement                      | Status | Notes                        |
| -------------------------------- | ------ | ---------------------------- |
| One-click convert note to ticket | ❌     | Requires integrations        |
| Duplicate detection              | ❌     | Requires NLP                 |
| Admin test prompts per scene     | ❌     | Not implemented              |
| Blind testing modes              | ⚠️     | Partially (isolation exists) |
| Spoken hotwords                  | ❌     | Not implemented              |
| Moment bookmarks                 | ❌     | Not implemented              |
| Post-note severity rating        | ❌     | Not implemented              |
| Cross-session trend analysis     | ❌     | Requires multiple sessions   |
| Scene/category heatmaps          | ❌     | Not implemented              |
| Anonymized tester views          | ❌     | Not implemented              |
| Admin-only identity resolution   | ❌     | Not implemented              |
| Redaction tools                  | ❌     | Not implemented              |

---

## Current Limitations

1. **No Authentication**: Anyone with an invite link can join; no login required
2. **No Real-time Updates**: Admin must refresh to see new notes
3. **Single Whisper Model**: No GPU acceleration, base model only
4. **No Search**: Cannot search across transcripts
5. **No Filtering**: Session list is chronological only
6. **Browser-Only Recording**: WebM format, no native app support

---

## Metrics for Success

| Metric                  | Target   | Current                            |
| ----------------------- | -------- | ---------------------------------- |
| Session creation        | < 2 min  | ✅ ~1 min                          |
| Tester join flow        | < 30 sec | ✅ ~15 sec                         |
| Recording to transcript | < 10 sec | ⚠️ Depends on Whisper/audio length |
| Report generation       | < 5 sec  | ✅ ~2 sec                          |
| PDF download            | < 3 sec  | ✅ ~1 sec                          |

---

## File Structure Reference

```
echo_test/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── admin/
│   │   │   ├── page.tsx                # Session list
│   │   │   └── sessions/
│   │   │       ├── new/page.tsx        # Create session
│   │   │       └── [id]/
│   │   │           ├── page.tsx        # Session detail
│   │   │           └── report/page.tsx # View report
│   │   ├── join/
│   │   │   ├── page.tsx                # Join landing
│   │   │   └── [token]/page.tsx        # Tester interface
│   │   └── api/
│   │       ├── sessions/               # CRUD for sessions
│   │       ├── join/[token]/           # Validate invite
│   │       ├── transcribe/             # Whisper proxy
│   │       ├── classify/               # Auto-classification
│   │       └── upload/                 # Audio storage
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── voice-recorder.tsx          # Recording UI
│   │   ├── notes-list.tsx              # Notes display/edit
│   │   └── pdf/session-report.tsx      # PDF template
│   ├── lib/
│   │   ├── utils.ts                    # Helpers
│   │   └── supabase/                   # DB clients
│   └── types/index.ts                  # TypeScript interfaces
├── supabase/migrations/                # Database schema
├── whisper-service/                    # Docker Whisper setup
└── README.md                           # Setup instructions
```

---

## Version History

| Version | Date     | Changes                    |
| ------- | -------- | -------------------------- |
| 0.1.0   | Dec 2024 | Initial MVP implementation |
