# Dashboard Widgets

This directory contains modular, reusable dashboard widgets for the ROOTED Way Companion app.

## Widgets

### AccountDetailsWidget
Displays user account information including email, user ID, and join date.

**Props:**
- `user`: User object with `id`, `email?`, and `created_at`

**Usage:**
```tsx
<AccountDetailsWidget user={user} />
```

### BiometricSyncWidget
Shows the status of wearable device connections (currently Garmin) with dynamic connection checking.

**Props:**
- `userId`: String user ID for database queries

**Features:**
- Real-time connection status
- Connection details (User ID, connection date)
- Direct links to manage connections
- Connect/disconnect functionality

**Usage:**
```tsx
<BiometricSyncWidget userId={user.id} />
```

### RecoveryStatsWidget
Displays wellness metrics and recovery statistics.

**Props:**
- `stats?`: Optional stats object with `sessions`, `streak`, and `totalTime`

**Usage:**
```tsx
<RecoveryStatsWidget stats={userStats} />
```

### QuickActionsWidget
Provides action buttons for common dashboard tasks.

**Props:**
- `actions?`: Optional array of custom actions

**Default Actions:**
- Start Breathwork
- Log Mood
- Set Goals

**Usage:**
```tsx
<QuickActionsWidget actions={customActions} />
```

### RecoveryPlanWidget
Displays today's recovery task from the user's active recovery plan.

**Props:**
- `userId`: String user ID for database queries

**Features:**
- Shows daily recovery task with action and rationale
- Progress tracking (Day X of Y)
- Mark task as completed functionality
- Generate new plan when no plan exists
- Link to full plan details page

**Usage:**
```tsx
<RecoveryPlanWidget userId={user.id} />
```

## Importing

Import individual widgets:
```tsx
import { AccountDetailsWidget } from '@/components/widgets'
```

Or import all widgets:
```tsx
import { 
  AccountDetailsWidget, 
  BiometricSyncWidget, 
  RecoveryStatsWidget, 
  QuickActionsWidget,
  DailyPulseWidget,
  RecoveryPlanWidget 
} from '@/components/widgets'
```

## Architecture

All widgets are:
- **Server Components** - Can perform server-side data fetching
- **Type-safe** - Full TypeScript support
- **Reusable** - Can be used across different pages
- **Consistent** - Follow the same design patterns
- **Modular** - Self-contained with clear interfaces

## Adding New Widgets

1. Create a new widget file in this directory
2. Export it from `index.ts`
3. Follow the established patterns for props and styling
4. Include proper TypeScript interfaces
5. Add documentation to this README 