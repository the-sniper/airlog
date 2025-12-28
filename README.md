# AirLog - Voice-Based User Testing Platform

A Next.js web application for capturing and organizing tester feedback during user testing sessions using voice recordings and automatic transcription.

## Features

- **Session Management**: Create sessions with scenes/tasks, generate invite links
- **Voice Recording**: Browser-based audio capture with MediaRecorder API
- **Transcription**: Self-hosted Whisper for speech-to-text conversion
- **Editable Transcripts**: Review and edit transcribed notes
- **Auto-Classification**: Notes tagged as Bug, Feature, UX, Performance, or Other
- **Bias Prevention**: Testers can't see others' feedback until session ends
- **Report Generation**: Summary reports with scene breakdowns

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database and storage)
- Docker (for running the Whisper transcription service)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Whisper Service URL (local Docker container)
NEXT_PUBLIC_WHISPER_URL=http://localhost:5000

# App URL (for generating invite links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Details

| Variable                        | Public | Description                                       |
| ------------------------------- | ------ | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes    | Your Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes    | Public anon key (subject to RLS policies)         |
| `SUPABASE_SERVICE_ROLE_KEY`     | **No** | Service role key (bypasses RLS, server-side only) |
| `NEXT_PUBLIC_WHISPER_URL`       | Yes    | URL to the Whisper transcription service          |
| `NEXT_PUBLIC_APP_URL`           | Yes    | Your app URL for generating invite links          |

> ⚠️ **Important**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It should only be used in server-side API routes.

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration

This creates:

- `sessions` table - Test session metadata
- `scenes` table - Tasks/scenes within a session
- `testers` table - Tester info with invite tokens
- `notes` table - Transcribed feedback with categories
- `audio-recordings` storage bucket - For audio files

## Installation

```bash
# Install dependencies
npm install

# Copy environment template and fill in your values
# Create .env.local with the following content:
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_WHISPER_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running the Full Stack

1. **Start the Whisper service** (see `whisper-service/README.md`):

   ```bash
   cd whisper-service
   docker-compose up -d
   ```

2. **Start the Next.js app**:
   ```bash
   npm run dev
   ```

## Project Structure

```
echo_test/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── join/               # Tester join pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── voice-recorder.tsx  # Audio recording component
│   │   └── notes-list.tsx      # Notes display/edit component
│   ├── lib/                    # Utilities and Supabase clients
│   └── types/                  # TypeScript interfaces
├── supabase/
│   └── migrations/             # Database migration scripts
├── whisper-service/            # Self-hosted Whisper Docker service
└── public/                     # Static assets
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Usage

### For Admins

1. Go to `/admin` to access the dashboard
2. Click "New Session" to create a test session
3. Add scenes/tasks for testers to complete
4. Share the generated invite link with testers
5. Start the session when ready
6. View real-time feedback as testers submit notes
7. End the session and view the report

### For Testers

1. Open the invite link shared by the admin
2. Enter your name to join the session
3. Wait for the session to start
4. Record voice notes for each scene
5. Edit transcriptions if needed
6. Submit feedback

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Transcription**: Self-hosted Whisper (Docker)
- **State Management**: React hooks + Zustand

## License

MIT
