# Implementation Plan: User-Based Testers & Members

## Overview

Refactor the tester and team member system to require registered users. This eliminates orphan records and ensures consistent identity across the platform.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Can unregistered users be testers? | No - must be registered users |
| Can unregistered users be team members? | No - must be registered users |
| How to handle invite by email? | Create pending invite, send signup email |
| Identification method | `user_id` (not email) |
| Email editable? | No - locked to user account |
| Auto-add or require acceptance? | Auto-add + send notification/email |

---

## Phase 1: Database Schema Changes

### 1.1 Create Pending Invites Table

```sql
-- supabase/migrations/022_pending_invites.sql

CREATE TABLE IF NOT EXISTS pending_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invite_type VARCHAR(50) NOT NULL, -- 'session' or 'team'
    target_id UUID NOT NULL, -- session_id or team_id
    invited_by UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    claimed_at TIMESTAMPTZ,
    UNIQUE(email, invite_type, target_id)
);

CREATE INDEX idx_pending_invites_email ON pending_invites(email);
CREATE INDEX idx_pending_invites_target ON pending_invites(invite_type, target_id);
```

### 1.2 Update Existing Tables

```sql
-- supabase/migrations/023_require_user_id.sql

-- For testers: user_id becomes required for new records
-- Note: Keep nullable for migration period, enforce in application
ALTER TABLE testers ALTER COLUMN email SET NOT NULL;

-- For team_members: user_id becomes required for new records
ALTER TABLE team_members ALTER COLUMN email SET NOT NULL;

-- Add index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
```

---

## Phase 2: API Changes

### 2.1 New API: List All Users (Admin)

**File**: `src/app/api/admin/users/route.ts`

```typescript
// GET /api/admin/users
// Query params: ?search=term&limit=50
// Returns: { id, first_name, last_name, email }[]
```

### 2.2 New API: Pending Invites

**File**: `src/app/api/admin/pending-invites/route.ts`

```typescript
// POST /api/admin/pending-invites
// Body: { email, invite_type: 'session'|'team', target_id }
// - Check if user exists → if yes, add directly
// - If no, create pending invite & send signup email

// GET /api/admin/pending-invites?target_type=session&target_id=xxx
// Returns pending invites for a session/team

// DELETE /api/admin/pending-invites/:id
// Cancel a pending invite
```

### 2.3 Update Signup API

**File**: `src/app/api/users/signup/route.ts`

Add at end of signup flow:
```typescript
// Check for pending invites matching this email
// For each pending invite:
//   - If session invite: create tester record with user_id
//   - If team invite: create team_member record with user_id
//   - Mark invite as claimed
```

### 2.4 Update Session Testers API

**File**: `src/app/api/sessions/[id]/testers/route.ts`

```typescript
// POST now requires either:
// 1. { user_ids: string[] } - add registered users directly
// 2. { members: [...] } with user_id for each (from team)
// 3. Reject requests without user_id (redirect to pending invites)

// Also: Send notification + email when adding tester
```

### 2.5 Update Team Members API

**File**: `src/app/api/teams/[id]/members/route.ts`

```typescript
// POST now requires: { user_id: string }
// Name/email are pulled from users table
// Reject if user_id not provided
```

### 2.6 New API: Email Tester on Add

**File**: `src/app/api/sessions/[id]/testers/notify/route.ts`

```typescript
// POST /api/sessions/[id]/testers/notify
// Body: { tester_ids: string[] }
// Sends email to newly added testers with session details
```

---

## Phase 3: UI Changes

### 3.1 Teams Page - Add Member Dialog

**File**: `src/app/admin/teams/page.tsx`

Replace current form with user search/select:

```
┌─────────────────────────────────────────────────┐
│  Add Team Member                                │
│  Add a registered user to {Team Name}           │
│  ─────────────────────────────────────────────  │
│                                                 │
│  🔍 Search users by name or email...            │
│  ┌──────────────────────────────────────────┐  │
│  │  □ John Doe (john@example.com)           │  │
│  │  □ Jane Smith (jane@example.com)         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ─── OR ───                                     │
│                                                 │
│  📧 Invite by Email                             │
│  [email@example.com                         ]   │
│  (User will be added when they register)        │
│                                                 │
│  [Cancel]                      [Add Member]    │
└─────────────────────────────────────────────────┘
```

### 3.2 Session Page - Add Tester Dialog

**File**: `src/app/admin/sessions/[id]/page.tsx`

Three tabs:

#### Tab 1: From Team (existing, update to use user_id)
```
Select team → shows members (only those with user_id)
```

#### Tab 2: From Users (NEW)
```
Search all registered users → multi-select → add
```

#### Tab 3: Invite by Email (UPDATED)
```
Enter email address
→ If registered: add directly
→ If not registered: create pending invite, send signup email
```

### 3.3 Tester/Member Details - Lock Email

When viewing/editing a tester or team member:
- Email field is **read-only** (displayed but not editable)
- Name fields use data from `users` table via `user_id` join

### 3.4 Show Pending Invites

In session/team detail views, show pending invites section:
```
Pending Invites (2)
├── pending@example.com - Invited Dec 27, expires Jan 3 [Resend] [Cancel]
└── new@example.com - Invited Dec 26, expires Jan 2 [Resend] [Cancel]
```

---

## Phase 4: Email Templates

### 4.1 Session Invite Email (Registered User)

**Subject**: You've been added to testing session: {session_name}

```
Hi {first_name},

You've been added to the testing session "{session_name}".

Session Details:
- Build Version: {build_version}
- Status: {status}

Join the session:
{join_url}

Best,
The Echo Team
```

### 4.2 Signup Invite Email (Unregistered User)

**Subject**: You're invited to join Echo

```
Hi,

You've been invited to join a testing session on Echo.

To participate, please create an account:
{signup_url}?email={encoded_email}

Once registered, you'll automatically be added to:
- Session: {session_name}

This invitation expires on {expiry_date}.

Best,
The Echo Team
```

---

## Phase 5: Component Refactoring

### 5.1 New Reusable Component: UserSelect

**File**: `src/components/ui/user-select.tsx`

```typescript
interface UserSelectProps {
  onSelect: (user: User) => void;
  multiple?: boolean;
  excludeIds?: string[]; // Already added users
  placeholder?: string;
}
```

Features:
- Debounced search input
- Fetches from `/api/admin/users?search=...`
- Shows user avatar, name, email
- Checkbox for multi-select mode

### 5.2 New Component: PendingInvitesList

**File**: `src/components/pending-invites-list.tsx`

```typescript
interface PendingInvitesListProps {
  type: 'session' | 'team';
  targetId: string;
  onResend: (inviteId: string) => void;
  onCancel: (inviteId: string) => void;
}
```

---

## Implementation Order

### Milestone 1: Foundation (APIs + Database)
1. [x] Create migration `022_pending_invites.sql`
2. [ ] Apply migration in Supabase Dashboard (manual step required)
3. [x] Create `/api/admin/users` endpoint
4. [x] Create `/api/admin/pending-invites` endpoints
5. [x] Update signup API to claim pending invites

### Milestone 2: Add Tester Flow
6. [x] Create `UserSelect` component
7. [x] Update Add Tester dialog with 3 tabs (From Team, From Users, Invite by Email)
8. [x] Add handlers for adding users and inviting by email
9. [x] Add notification sending on tester add
10. [x] Session invite email already exists

### Milestone 3: Add Team Member Flow
11. [x] Update Add Member dialog with 2 tabs (From Users, Invite by Email)
12. [x] Add handlers for adding users and inviting by email
13. [ ] Show pending invites in team detail (optional enhancement)

### Milestone 4: Email Invites
14. [x] Create signup invite email template
15. [x] Pre-fill email on signup page from URL param (uses inviteEmail param)
16. [ ] Test full invite → signup → auto-add flow (requires migration first)

### Milestone 5: Cleanup
17. [x] Lock email editing for testers linked to user accounts
18. [x] Lock email editing for team members linked to user accounts
19. [ ] Add pending invites UI to session detail (optional enhancement)
20. [ ] Add pending invites UI to team detail (optional enhancement)

---

## Migration Strategy for Existing Data

### Testers without user_id
- Keep existing records as-is (grandfathered)
- Only new testers require user_id
- Display warning in admin UI: "Legacy tester - not linked to user account"

### Team Members without user_id
- Keep existing records as-is (grandfathered)
- Only new members require user_id
- Display warning in admin UI: "Legacy member - not linked to user account"

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Email editable? | No - comes from users table |
| Identify by email or user_id? | user_id internally |
| Show user list to admins? | Yes, with search |
| Unregistered user handling? | Create pending invite, send signup email |
| Notification on add? | Yes - in-app + email |

---

## Files to Create/Modify

### New Files
- `supabase/migrations/022_pending_invites.sql`
- `supabase/migrations/023_require_user_id.sql`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/pending-invites/route.ts`
- `src/components/ui/user-select.tsx`
- `src/components/pending-invites-list.tsx`
- `src/lib/emails/session-invite.ts`
- `src/lib/emails/signup-invite.ts`

### Modified Files
- `src/app/api/users/signup/route.ts`
- `src/app/api/sessions/[id]/testers/route.ts`
- `src/app/api/teams/[id]/members/route.ts`
- `src/app/admin/teams/page.tsx`
- `src/app/admin/sessions/[id]/page.tsx`
- `src/types/index.ts`
