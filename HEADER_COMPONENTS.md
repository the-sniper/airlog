# Header Components Documentation

## Overview

Two reusable header components have been created to provide consistent navigation across the application:

1. **TesterHeader** - For tester-facing pages (dashboard, sessions, join pages)
2. **AdminHeader** - For admin-facing pages

## TesterHeader Component

### Location

`/src/components/tester-header.tsx`

### Features

- **Logo** - Links to home page
- **Navigation Links** (Desktop only)
  - Dashboard (`/dashboard`)
  - Sessions (`/sessions`)
- **Notifications** - TesterNotifications component with real-time polling
- **User Dropdown** (Desktop only)
  - Displays "Hey {FirstName}"
  - Theme toggle
  - Logout option
- **Mobile Drawer** - Full navigation menu for mobile devices
- **Logout Confirmation Dialog**

### Usage

```tsx
import { TesterHeader } from "@/components/tester-header";

// In your page component
export default function YourPage() {
  const [user, setUser] = useState(null);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/users/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <TesterHeader user={user} />
      {/* Your page content */}
    </div>
  );
}
```

### Props

```typescript
interface TesterHeaderProps {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}
```

### Pages to Update

Replace the existing header implementation in these pages:

1. **`/src/app/dashboard/page.tsx`**
   - Remove lines 80-279 (existing header and drawer code)
   - Add `<TesterHeader user={user} />` after the opening `<div>` tag

2. **`/src/app/sessions/page.tsx`** (if it exists)
   - Add `<TesterHeader user={user} />` at the top

3. **`/src/app/join/[token]/page.tsx`**
   - Replace lines 395-410 (existing header) with `<TesterHeader user={user} />`
   - Note: You'll need to fetch user data or pass tester info as user

## AdminHeader Component

### Location

`/src/components/admin-header.tsx`

### Features

- **Logo** - Links to home page
- **Navigation Links** (Desktop only)
  - Sessions (`/admin`)
  - Teams (`/admin/teams`)
- **Notifications Bell** (Desktop only) - Placeholder for future admin notifications
- **Admin Dropdown** (Desktop only)
  - Displays admin name or email
  - Theme toggle
  - Logout option
- **Mobile Drawer** - Full navigation menu for mobile devices
- **Active Route Highlighting**
- **Logout Confirmation Dialog**

### Usage

```tsx
import { AdminHeader } from "@/components/admin-header";

// In your admin page component
export default function AdminPage() {
  const [admin, setAdmin] = useState(null);

  // Fetch admin data
  useEffect(() => {
    async function fetchAdmin() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setAdmin(data);
      }
    }
    fetchAdmin();
  }, []);

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <AdminHeader admin={admin} />
      {/* Your page content */}
    </div>
  );
}
```

### Props

```typescript
interface AdminHeaderProps {
  admin?: {
    id: string;
    email: string;
    name?: string;
  } | null;
}
```

## Key Features Included

### Notification & Polling (TesterHeader)

The TesterHeader includes the `TesterNotifications` component which:

- Polls for session updates every 5 seconds
- Shows real-time notifications for:
  - New session invites
  - Session started
  - Session ended
  - Session restarted
  - Report sent
- Persists notifications in localStorage
- Displays unread count badge
- Supports both single-session and multi-session modes

### Responsive Design

Both headers include:

- Desktop navigation with dropdown menus
- Mobile hamburger menu with slide-out drawer
- Smooth transitions and animations
- Glass morphism effects
- Theme toggle integration

### Logout Flow

Both headers include:

- Confirmation dialog before logout
- Proper API call to logout endpoint
- Redirect to appropriate login page
- Router refresh to clear state

## Migration Guide

### For Dashboard Page (`/src/app/dashboard/page.tsx`)

**Before:**

```tsx
return (
  <div className="min-h-screen gradient-mesh flex flex-col">
    <header className="h-16 border-b border-border/50 bg-card/80 glass flex items-center justify-between px-4 z-40">
      {/* ... existing header code ... */}
    </header>
    {/* ... mobile drawer code ... */}
    {/* ... logout dialog ... */}
    <main className="flex-1 flex items-center justify-center p-6">
      {/* content */}
    </main>
  </div>
);
```

**After:**

```tsx
import { TesterHeader } from "@/components/tester-header";

return (
  <div className="min-h-screen gradient-mesh flex flex-col">
    <TesterHeader user={user} />
    <main className="flex-1 flex items-center justify-center p-6">
      {/* content */}
    </main>
  </div>
);
```

### For Join Page (`/src/app/join/[token]/page.tsx`)

The join page currently has a minimal header. You can replace it with:

```tsx
import { TesterHeader } from "@/components/tester-header";

// Convert tester data to user format
const user = tester
  ? {
      id: tester.user_id || tester.id,
      first_name: tester.first_name,
      last_name: tester.last_name,
      email: tester.email,
    }
  : null;

return (
  <>
    {isAdmin && <AdminMobileHeader hideBottomNav />}
    <TesterHeader user={user} />
    {/* rest of the page */}
  </>
);
```

## Benefits

1. **Consistency** - Same header design across all tester/admin pages
2. **Maintainability** - Update header in one place, affects all pages
3. **Reusability** - Easy to add to new pages
4. **Feature Complete** - Includes notifications, theme toggle, logout, mobile support
5. **Type Safe** - TypeScript interfaces for props
6. **Accessible** - Proper ARIA labels and semantic HTML

## Notes

- Both headers use the existing UI components from `@/components/ui`
- The TesterHeader integrates seamlessly with the TesterNotifications component
- Mobile drawers use the same design pattern as the existing dashboard
- Logout dialogs prevent accidental logouts
- Theme toggle is integrated in both desktop and mobile views
