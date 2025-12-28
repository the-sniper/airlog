---
name: Voice Testing Platform Plan
overview: Create a Next.js web application for voice-based testing notes with Supabase backend and self-hosted Whisper transcription, including a scoping document that outlines MVP features vs future scope.
todos:
  - id: create-scope-doc
    content: Create SCOPE.md documenting MVP features and future scope
    status: completed
  - id: project-setup
    content: Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
    status: completed
  - id: supabase-setup
    content: Set up Supabase project and create database schema migrations
    status: completed
  - id: auth-system
    content: Implement invite-link based authentication for testers
    status: completed
  - id: admin-dashboard
    content: Build admin dashboard for session management
    status: completed
  - id: tester-interface
    content: Build tester interface with scene selection
    status: completed
  - id: voice-recorder
    content: Implement voice recording component with MediaRecorder API
    status: completed
  - id: whisper-service
    content: Set up self-hosted Whisper Docker service
    status: completed
  - id: transcription-flow
    content: Integrate transcription API with editable transcripts
    status: completed
  - id: classification
    content: Implement auto-classification for notes
    status: completed
  - id: bias-prevention
    content: Add visibility controls to hide others' feedback during active sessions
    status: completed
  - id: report-generation
    content: Build report generation with PDF export
    status: completed
---

# Voice-Based Testing Notes Platform - Implementation Plan

## Overview

Build a Next.js web application based on the project specification, with an Extended MVP scope using Supabase for database/storage, simple invite-link authentication, and self-hosted Whisper for transcription.

---

## Step 1: Create Scoping Document

Create [`SCOPE.md`](SCOPE.md) documenting:

### Included in MVP

- **Session Management**: Create, start, end sessions with scenes
- **Voice Recording**: Record, pause, resume, stop with browser MediaRecorder API
- **Transcription**: Self-hosted Whisper integration via API
- **Editable Transcripts**: Edit transcribed text, retain raw + edited versions
- **Classification/Tagging**: Auto-classification (Bug, Feature, UX, Performance, Other)
- **Bias Prevention**: Testers cannot see others' feedback until session ends
- **Report Generation**: Summary, scene breakdown, PDF export
- **Simple Auth**: Invite-link based session access (no full user accounts)

### Deferred to Future

- Full user authentication (OAuth, accounts)
- Confluence/Jira/Linear integrations
- Cross-session trend analysis
- Spoken hotwords and bookmarks
- Mobile app (React Native)
- Anonymization features
- Duplicate detection
- Multi-project dashboards

---

## Step 2: Project Setup

```
echo_test/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/            # Admin routes
│   │   ├── (tester)/           # Tester routes
│   │   └── api/                # API routes
│   ├── components/             # React components
│   ├── lib/                    # Utilities, Supabase client
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── whisper-service/            # Self-hosted Whisper API (Docker)
└── public/
```

---

## Step 3: Database Schema (Supabase)

```mermaid
erDiagram
    sessions {
        uuid id PK
        string name
        string build_version
        timestamp created_at
        timestamp started_at
        timestamp ended_at
        enum status
    }
    scenes {
        uuid id PK
        uuid session_id FK
        string name
        int order_index
    }
    testers {
        uuid id PK
        uuid session_id FK
        string name
        string invite_token
    }
    notes {
        uuid id PK
        uuid session_id FK
        uuid scene_id FK
        uuid tester_id FK
        string audio_url
        text raw_transcript
        text edited_transcript
        enum category
        boolean auto_classified
        timestamp created_at
    }
    sessions ||--o{ scenes : contains
    sessions ||--o{ testers : has
    sessions ||--o{ notes : contains
    scenes ||--o{ notes : tagged_with
    testers ||--o{ notes : records
```

---

## Step 4: Core Features Implementation

### 4.1 Admin Dashboard

- Create new sessions with name, build version, scenes
- View session list and status
- Start/end sessions
- Generate and download PDF reports

### 4.2 Tester Interface

- Join via invite link with token
- Select current scene
- Voice recording controls (Record/Pause/Resume/Stop)
- View and edit own transcripts
- Optional category selection before recording

### 4.3 Whisper Integration

- Docker container running Whisper API (faster-whisper or whisper.cpp)
- API endpoint to receive audio blob, return transcription
- Confidence scoring for words

### 4.4 Report Generation

- Server-side PDF generation using `@react-pdf/renderer` or `puppeteer`
- Summary statistics, scene breakdowns, grouped feedback

---

## Technical Stack

| Layer | Technology |

|-------|------------|

| Framework | Next.js 14 (App Router) |

| Styling | Tailwind CSS + shadcn/ui |

| Database | Supabase (PostgreSQL) |

| Storage | Supabase Storage (audio files) |

| STT | Self-hosted Whisper (Docker) |

| PDF | @react-pdf/renderer |

| Deployment | Vercel (frontend) + Docker (Whisper) |

---

## Architecture Flow

```mermaid
flowchart TB
    subgraph Frontend [Next.js Frontend]
        AdminDash[Admin Dashboard]
        TesterUI[Tester Interface]
        VoiceRec[Voice Recorder]
    end

    subgraph Backend [API Layer]
        SessionAPI[Session API]
        TranscribeAPI[Transcription API]
        ReportAPI[Report Generator]
    end

    subgraph Services [External Services]
        Supabase[(Supabase DB + Storage)]
        Whisper[Whisper Container]
    end

    AdminDash --> SessionAPI
    TesterUI --> SessionAPI
    VoiceRec --> TranscribeAPI
    TranscribeAPI --> Whisper
    SessionAPI --> Supabase
    TranscribeAPI --> Supabase
    ReportAPI --> Supabase
    AdminDash --> ReportAPI
```
