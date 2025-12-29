# AirLog - Voice-Based User Testing Platform

A modern, full-stack Next.js web application for capturing and organizing tester feedback during user testing sessions using voice recordings, automatic transcription, and AI-powered analysis.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

---

## Key Features

### Session Management

- **Create & Manage Sessions** – Define test sessions with names, descriptions, build versions, and multiple scenes/tasks
- **Session Lifecycle** – Draft → Active → Completed state machine with admin controls
- **Shareable Join Codes** – Generate unique session codes for testers to join
- **Real-time Tester Tracking** – Monitor who has joined, left, or is actively testing

### Voice Recording & Transcription

- **Browser-Based Recording** – One-click audio capture with pause/resume controls
- **Whisper Integration** – Self-hosted OpenAI Whisper for automatic speech-to-text
- **Editable Transcripts** – Review and edit transcriptions while preserving originals
- **Audio Playback** – Listen to recordings directly within the app

### AI-Powered Features

- **Auto-Classification** – Notes automatically tagged as Bug, Feature, UX, Performance, or Other
- **AI Summaries** – Generate intelligent session summaries and per-note insights using OpenAI
- **Smart Categorization** – Keyword and semantic analysis for accurate classification

### Team Management

- **Team Creation** – Organize testers into reusable teams
- **Member Management** – Add/remove team members with email invitations
- **Bulk Invites** – Add entire teams to sessions with one click
- **Team-Based Analytics** – Track team performance across sessions

### Authentication & Authorization

- **Dual Auth System** – Separate admin and tester authentication flows
- **JWT-Based Sessions** – Secure token-based authentication using `jose`
- **Password Management** – Signup, login, and password reset with email verification
- **Protected Routes** – Middleware-based route protection for admin and tester areas

### Analytics Dashboard

- **Session Statistics** – Total notes, category breakdowns, scene distribution
- **Tester Engagement** – Leaderboards and participation metrics
- **Temporal Analytics** – Activity over time, sessions over time charts
- **Category Insights** – Visual breakdown of feedback categories
- **Historical Comparison** – Compare sessions across different time periods

### Report Generation

- **PDF Export** – Professional PDF reports with `@react-pdf/renderer`
- **Shareable Reports** – Generate public report links with unique tokens
- **Email Reports** – Send reports directly to stakeholders via Resend
- **Session Summaries** – AI-generated executive summaries

### Real-Time Features

- **Tester Notifications** – In-app notification system for session invites
- **Auto-Polling** – Real-time updates for active sessions (10-second intervals)
- **Live Weather Banner** – Dynamic weather display with effects (rain, snow, fog, etc.)

### Progressive Web App (PWA)

- **Installable** – Add to home screen on mobile devices
- **Service Worker** – Offline-capable with caching strategies
- **Push-Ready** – Architecture supports push notifications

### UI/UX

- **Dark/Light Mode** – System-aware theme with manual toggle
- **Responsive Design** – Mobile-first design with adaptive layouts
- **Drag & Drop** – Reorder scenes with `@dnd-kit`
- **shadcn/ui Components** – Consistent, accessible UI components
- **Weather Effects** – Animated backgrounds (rain, snow, clouds, fog, thunder)

### Bias Prevention

- **Isolated Feedback** – Testers only see their own notes during active sessions
- **Post-Session Reveal** – All feedback visible only after session ends
- **Admin-Only Insights** – Full visibility restricted to administrators

---

## Project Structure

```
echo_test/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, signup, password reset pages
│   │   ├── (public)/           # Public join pages
│   │   ├── (tester)/           # Tester dashboard, sessions, profile
│   │   ├── admin/              # Admin dashboard and management
│   │   │   ├── sessions/       # Session CRUD and details
│   │   │   └── teams/          # Team management
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin-specific endpoints
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── classify/       # AI classification
│   │   │   ├── join/           # Session joining
│   │   │   ├── leave/          # Session leaving
│   │   │   ├── sessions/       # Session CRUD
│   │   │   ├── teams/          # Team management
│   │   │   ├── transcribe/     # Whisper proxy
│   │   │   ├── upload/         # Audio storage
│   │   │   └── users/          # User management
│   │   └── report/             # Public report pages
│   ├── components/
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── analytics/      # Analytics charts and insights
│   │   │   └── dashboard/      # Dashboard widgets
│   │   ├── common/             # Shared components (header, theme, PWA)
│   │   ├── pdf/                # PDF report templates
│   │   ├── tester/             # Tester-specific components
│   │   │   └── dashboard/      # Tester dashboard widgets
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-tester-notifications.ts
│   │   ├── use-weather.ts
│   │   └── usePollRealtime.ts
│   ├── lib/                    # Utilities and clients
│   │   └── supabase/           # Supabase client configuration
│   ├── middleware.ts           # Route protection middleware
│   └── types/                  # TypeScript interfaces
├── supabase/
│   └── migrations/             # 23 database migration files
├── whisper-service/            # Self-hosted Whisper Docker service
├── public/
│   └── sw.js                   # Service worker for PWA
└── scripts/                    # Utility scripts
```

---

## Tech Stack

| Category             | Technology                          |
| -------------------- | ----------------------------------- |
| **Framework**        | Next.js 14 (App Router)             |
| **Language**         | TypeScript 5.4                      |
| **Styling**          | Tailwind CSS 3.4 + shadcn/ui        |
| **Database**         | Supabase (PostgreSQL)               |
| **Storage**          | Supabase Storage                    |
| **Authentication**   | JWT via `jose` + `bcryptjs`         |
| **Transcription**    | Self-hosted OpenAI Whisper (Docker) |
| **AI/LLM**           | OpenAI API                          |
| **Email**            | Nodemailer (SMTP)                   |
| **PDF Generation**   | @react-pdf/renderer                 |
| **Charts**           | Recharts                            |
| **Drag & Drop**      | @dnd-kit                            |
| **State Management** | React hooks                         |

---

## Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Supabase** account (for database and storage)
- **Docker** (for running the Whisper transcription service)
- **OpenAI API key** (for AI summaries and classification)
- **SMTP credentials** (Gmail or other provider for email notifications)

---

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Whisper Service URL (local Docker container)
WHISPER_API_URL=http://localhost:9000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Echo Test <your-email@gmail.com>"

# Authentication Secrets
ADMIN_JWT_SECRET=your-secure-admin-secret
USER_JWT_SECRET=your-secure-user-secret

# OpenAI (for AI summaries)
OPENAI_API_KEY=sk-your-openai-api-key
```

### Variable Reference

| Variable                        | Public | Description                               |
| ------------------------------- | ------ | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes    | Your Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes    | Public anon key (subject to RLS policies) |
| `SUPABASE_SERVICE_ROLE_KEY`     | **No** | Service role key (server-side only)       |
| `WHISPER_API_URL`               | **No** | URL to the Whisper transcription service  |
| `NEXT_PUBLIC_APP_URL`           | Yes    | Your app URL for generating links         |
| `SMTP_HOST`                     | **No** | SMTP server hostname                      |
| `SMTP_PORT`                     | **No** | SMTP server port (typically 587 for TLS)  |
| `SMTP_SECURE`                   | **No** | Use SSL/TLS directly (false for STARTTLS) |
| `SMTP_USER`                     | **No** | SMTP authentication username              |
| `SMTP_PASS`                     | **No** | SMTP authentication password/app password |
| `SMTP_FROM`                     | **No** | Sender email with display name            |
| `ADMIN_JWT_SECRET`              | **No** | Secret for admin JWT tokens               |
| `USER_JWT_SECRET`               | **No** | Secret for tester JWT tokens              |
| `OPENAI_API_KEY`                | **No** | OpenAI API key for AI features            |

> ⚠️ **Important**: Never expose secrets (`SUPABASE_SERVICE_ROLE_KEY`, `*_JWT_SECRET`, `OPENAI_API_KEY`, `SMTP_PASS`) to the client.
>
> 💡 **Gmail Tip**: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your account password for `SMTP_PASS`.

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd echo_test

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local  # Then fill in your values

# Run database migrations (via Supabase Dashboard SQL Editor)
# Execute each file in supabase/migrations/ in order

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running the Full Stack

### 1. Start the Whisper Service

```bash
cd whisper-service
docker-compose up -d
```

### 2. Start the Next.js App

```bash
npm run dev
```

---

## Available Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm run dev`    | Start development server  |
| `npm run build`  | Build for production      |
| `npm run start`  | Start production server   |
| `npm run lint`   | Run ESLint                |
| `npm run format` | Format code with Prettier |

---

## User Flows

### Admin Flow

1. **Login** at `/admin/login` with admin credentials
2. **Create Session** – Add name, description, build version, and scenes
3. **Add Testers** – Invite individual testers or add entire teams
4. **Share Join Code** – Testers use the session code to join
5. **Start Session** – Enable recording for testers
6. **Monitor** – View incoming notes in real-time
7. **End Session** – Lock recording and reveal all feedback
8. **Generate Report** – View analytics, generate AI summary, export PDF

### Tester Flow

1. **Signup/Login** at `/signup` or `/login`
2. **View Dashboard** – See active sessions and pending invites
3. **Join Session** – Use session join code or accept invite
4. **Record Notes** – Select scene, record voice, auto-transcribe
5. **Edit Transcripts** – Refine transcriptions if needed
6. **Leave Session** – Exit when done testing

---

## Database Schema

The application uses 23 database migrations located in `supabase/migrations/`. Key tables include:

| Table                   | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `sessions`              | Session metadata, status, timestamps, join codes       |
| `scenes`                | Tasks/scenes within sessions with descriptions         |
| `testers`               | Tester info with invite tokens and session association |
| `notes`                 | Transcribed feedback with categories and AI summaries  |
| `teams`                 | Team definitions for grouping testers                  |
| `team_members`          | Team membership with user associations                 |
| `users`                 | User accounts with authentication data                 |
| `pending_invites`       | Session invitations awaiting acceptance                |
| `password_reset_tokens` | Password reset request tracking                        |
| `poll_questions`        | Polling questions for sessions                         |

---

## Security

- **JWT Authentication** – Separate tokens for admin/tester with configurable secrets
- **Middleware Protection** – Routes protected at the edge with Next.js middleware
- **Password Hashing** – bcrypt-based password storage
- **RLS Policies** – Supabase Row Level Security for database access control
- **Secrets Management** – Server-side only access to sensitive keys

---

## PWA Features

- **Service Worker** – Caching for offline access (`public/sw.js`)
- **Install Prompt** – Custom install banner for mobile users
- **App Manifest** – Proper metadata for home screen installation

---

## License

MIT

---

## Version History

| Version | Date     | Changes                                           |
| ------- | -------- | ------------------------------------------------- |
| 1.0.0   | Dec 2024 | Full-featured MVP with auth, teams, AI, analytics |
