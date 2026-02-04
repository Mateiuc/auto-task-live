
## Fix: Android WebView Only Shows Time (Not Date) for datetime-local Input

### Problem
On the **Android app** (running via Capacitor), the `<input type="datetime-local">` field only displays a **time picker** without a date selector. This is a known limitation with certain Android WebView versions that don't fully support the datetime-local input type.

### Solution
Replace the native `datetime-local` input with a **custom date/time picker** using:
1. A **separate date input** (`type="date"`) - Always works on Android
2. A **separate time input** (`type="time"`) - Always works on Android

This approach is more compatible across all Android WebView versions and gives users clear, dedicated controls for both date and time.

### Visual Change

**Before (Current):**
```
Start: [datetime-local input] ← Only time picker shown on Android
End:   [datetime-local input] ← Only time picker shown on Android
```

**After (Fixed):**
```
Start: [date input] [time input]  ← Both selectors work on Android
End:   [date input] [time input]  ← Both selectors work on Android
```

### Implementation

**File: `src/lib/formatTime.ts`**
- Add helper function `formatDateForInput(date)` to return `YYYY-MM-DD` format for date inputs

**File: `src/components/EditTaskDialog.tsx`**
1. Update the state to track separate date and time values when editing:
   ```typescript
   const [editingPeriod, setEditingPeriod] = useState<{
     sessionId: string;
     periodId: string;
     field: 'startTime' | 'endTime';
     dateValue: string;  // YYYY-MM-DD
     timeValue: string;  // HH:MM
   } | null>(null);
   ```

2. Replace each `datetime-local` input with two inputs side by side:
   - `<Input type="date" ... />` for the date portion
   - `<Input type="time" ... />` for the time portion

3. Update `handlePeriodTimeChange` to:
   - Accept a `part` parameter (`'date'` or `'time'`)
   - Merge the date and time values together

4. Update `handlePeriodTimeBlur` to:
   - Combine `dateValue` and `timeValue` into a full Date object
   - Continue with existing validation and conflict checks

### Layout Adjustment
Each period row will have a 4-column grid for Start/End with date/time split:
```
Period 1: 00:30:00                    [🗑️]
Start: [Feb 4    ] [09:00]
End:   [Feb 4    ] [09:30]
```

### Technical Details

**New helper in `formatTime.ts`:**
```typescript
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

**Updated period input section:**
```tsx
<div className="grid grid-cols-2 gap-1 px-1">
  <div>
    <Label className="text-[10px]">Start</Label>
    <div className="flex gap-1">
      <Input type="date" ... className="h-8 text-xs flex-1" />
      <Input type="time" ... className="h-8 text-xs w-20" />
    </div>
  </div>
  <div>
    <Label className="text-[10px]">End</Label>
    <div className="flex gap-1">
      <Input type="date" ... className="h-8 text-xs flex-1" />
      <Input type="time" ... className="h-8 text-xs w-20" />
    </div>
  </div>
</div>
```

### Summary of Changes

| File | Change |
|------|--------|
| `src/lib/formatTime.ts` | Add `formatDateForInput()` helper function |
| `src/components/EditTaskDialog.tsx` | Replace `datetime-local` inputs with separate `date` + `time` inputs; update state and handlers to merge values |

This ensures Android users can properly select both the date and time when editing work periods.
