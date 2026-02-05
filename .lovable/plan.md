
## Improve Visibility and Contrast Across the Entire App

### Problem
The current design has low contrast and visibility issues throughout the application:
- Semi-transparent color backgrounds are hard to see (e.g., `bg-blue-500/10`)
- Text is too small in many areas (using `text-[10px]`, `text-xs`)
- Font weights are too light (mostly `font-normal`)
- Labels and muted text blend into backgrounds
- Borders are thin and hard to see
- Form inputs don't stand out against card backgrounds

### Solution Overview
Apply a comprehensive styling upgrade across the entire application to improve readability and visual clarity.

---

### 1. CSS Design System Improvements

**File: `src/index.css`**

Update the CSS variables for better contrast:

| Variable | Current (Light) | New (Light) | Purpose |
|----------|-----------------|-------------|---------|
| `--muted-foreground` | `215 15% 45%` | `215 20% 35%` | Darker secondary text |
| `--border` | `214 20% 88%` | `214 25% 80%` | More visible borders |
| `--shadow-md` | `0.1` opacity | `0.15` opacity | Stronger card shadows |

| Variable | Current (Dark) | New (Dark) | Purpose |
|----------|----------------|------------|---------|
| `--muted-foreground` | `215 15% 65%` | `215 20% 75%` | Lighter secondary text |
| `--border` | `215 20% 22%` | `215 25% 30%` | More visible borders |

---

### 2. Vehicle Color Scheme Improvements

**File: `src/lib/vehicleColors.ts`**

Increase opacity values for all color schemes:

```text
Current                          New
---------------------------------|---------------------------------
bg-blue-50/80                    bg-blue-100 dark:bg-blue-900/60
border-blue-300/40               border-blue-400/60 dark:border-blue-600/60
bg-blue-500/10                   bg-blue-500/25 border-blue-500/40
gradient from-blue-100           from-blue-200 dark:from-blue-900/70
```

Apply same pattern to all 12 color schemes (blue, green, purple, orange, pink, cyan, amber, indigo, rose, emerald, teal, violet).

---

### 3. Session Color Scheme Improvements

**File: `src/lib/sessionColors.ts`**

Increase opacity for session/period/part backgrounds:

| Level | Current | New |
|-------|---------|-----|
| Session | `bg-{color}-500/10` | `bg-{color}-500/25` |
| Period | `bg-{color}-500/20` | `bg-{color}-500/35` |
| Part | `bg-{color}-500/30` | `bg-{color}-500/45` |

Border opacities also increased proportionally.

---

### 4. Input Component Improvements

**File: `src/components/ui/input.tsx`**

Add stronger styling to all inputs:

```text
Current:
- border-input (subtle)
- text-base / text-sm

New:
- bg-white dark:bg-gray-900 (solid background)
- border-2 (thicker border)
- font-medium (bolder text)
- shadow-sm (subtle depth)
```

---

### 5. Label Component Improvements

**File: `src/components/ui/label.tsx`**

Make labels more prominent:

```text
Current: text-sm font-medium
New:     text-sm font-semibold text-foreground
```

---

### 6. Card Component Improvements

**File: `src/components/ui/card.tsx`**

Enhance card visibility:

```text
Current: shadow-sm
New:     shadow-md border-2
```

---

### 7. Main Page Header Improvements

**File: `src/pages/Index.tsx`**

Make the header and section titles more prominent:

```text
Header background: bg-primary/10 → bg-primary/20
Title: text-base font-bold → text-lg font-bold
Section headings: text-lg font-semibold → text-xl font-bold
```

---

### 8. TaskCard Improvements

**File: `src/components/TaskCard.tsx`**

Increase text visibility in task cards:

| Element | Current | New |
|---------|---------|-----|
| Vehicle info | `text-sm` | `text-sm font-semibold` |
| Stats labels | `text-xs` | `text-xs font-medium` |
| Stats values | `font-semibold text-xs` | `font-bold text-sm` |
| Session headers | `font-semibold text-xs` | `font-bold text-sm` |
| Timeline text | `text-[10px]` | `text-xs font-medium` |
| Parts text | `text-[10px]` | `text-xs` |

---

### 9. EditTaskDialog Improvements

**File: `src/components/EditTaskDialog.tsx`**

Improve period editing section visibility:

```text
Current Labels: text-[10px]
New Labels:     text-xs font-semibold uppercase tracking-wide

Current Inputs: h-8 text-xs
New Inputs:     h-9 text-sm font-medium bg-white dark:bg-gray-900 border-2 shadow-sm

Session headers: font-semibold text-sm → font-bold text-base
Period headers:  font-medium text-xs → font-semibold text-sm
```

---

### 10. Dialog Headers Improvements

**Files: Multiple dialog components**

Standardize dialog header styling:

```text
Current: text-base font-bold
New:     text-lg font-bold
```

Apply to:
- `AddVehicleDialog.tsx`
- `CompleteWorkDialog.tsx`
- `SettingsDialog.tsx`
- `EditTaskDialog.tsx`

---

### 11. Button Visibility in Menu/Settings

**File: `src/components/SettingsDialog.tsx`**

Make menu buttons more visible:

```text
Current buttons:
  bg-primary/10 hover:bg-primary/20

New buttons:
  bg-primary/20 hover:bg-primary/30 font-semibold
```

Same pattern for all colored menu buttons.

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update CSS variables for better contrast |
| `src/lib/vehicleColors.ts` | Increase color opacity values |
| `src/lib/sessionColors.ts` | Increase color opacity values |
| `src/components/ui/input.tsx` | Add solid background, thicker border, bolder text |
| `src/components/ui/label.tsx` | Increase font weight |
| `src/components/ui/card.tsx` | Stronger shadows and borders |
| `src/pages/Index.tsx` | Bolder headers, larger section titles |
| `src/components/TaskCard.tsx` | Increase text sizes and weights throughout |
| `src/components/EditTaskDialog.tsx` | Improve input and label visibility |
| `src/components/AddVehicleDialog.tsx` | Bolder dialog title |
| `src/components/CompleteWorkDialog.tsx` | Bolder dialog title |
| `src/components/SettingsDialog.tsx` | Bolder menu buttons and titles |

---

### Visual Impact

**Before:**
- Washed out, semi-transparent backgrounds
- Small, thin text that's hard to read
- Inputs blend into backgrounds
- Low contrast throughout

**After:**
- Solid, clearly visible colored sections
- Bold, readable text at appropriate sizes
- Inputs clearly stand out with solid backgrounds
- High contrast design for better mobile usability
