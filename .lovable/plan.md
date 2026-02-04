

## Improve Period Date Editing in Edit Task Dialog

### Current Situation
The period date editing feature already exists but has two issues:
1. The date button is tiny (10px text) and users don't notice it
2. The Calendar may not be interactive inside the dialog due to missing `pointer-events-auto`

### Changes

**File: `src/components/ui/calendar.tsx`**
- Add `pointer-events-auto` to the DayPicker className to ensure calendar is interactive inside dialogs/popovers

**File: `src/components/EditTaskDialog.tsx`**
- Make the date picker button more prominent and obvious:
  - Add a calendar icon next to the date text
  - Increase button size slightly for better touch targets
  - Add a visual hint that it's clickable (border/outline style)

### Visual Change

**Before:**
```
Period 1: 01:30:00  [Feb 4]  🗑️
```
(tiny, easy to miss)

**After:**
```
Period 1: 01:30:00  [📅 Feb 4]  🗑️
```
(with calendar icon, outlined button style, easier to see and tap)

### Implementation Details

1. Update Calendar className from:
   ```typescript
   className={cn("p-3", className)}
   ```
   To:
   ```typescript
   className={cn("p-3 pointer-events-auto", className)}
   ```

2. Update the period date button styling:
   - Add `CalendarDays` icon from lucide-react
   - Change variant from `ghost` to `outline` for visibility
   - Slightly increase padding for better touch targets

