

## Fix Client Portal - Vehicles Not Fully Scrollable

### Problem
When a client opens the shared portal link, they can only see 1-2 vehicles out of 6. The rest are cut off and not scrollable. This happens because the layout uses `flex-1 overflow-y-auto` inside a `min-h-screen flex flex-col` container, which can fail in mobile in-app browsers (WhatsApp, SMS apps) where viewport height behaves unpredictably.

### Solution
Change the cost breakdown view layout to use a simpler, more reliable scrolling approach that works across all mobile browsers:

- Remove the `flex flex-col` and `flex-1 overflow-y-auto` pattern
- Use a standard block layout with the header fixed via `sticky top-0` (already in place)
- Let the page body scroll naturally with normal document flow

### Changes

**File: `src/pages/ClientPortal.tsx`** (lines 148-162)

Change the cost breakdown view container from:
```
<div className="min-h-screen bg-background flex flex-col">
  ...header...
  <div className="flex-1 overflow-y-auto p-4">
```

To:
```
<div className="min-h-screen bg-background">
  ...header...
  <div className="p-4 pb-8">
```

This removes the flex layout and `overflow-y-auto`, letting the browser handle scrolling naturally. Added `pb-8` for bottom padding so the last vehicle card isn't cut off by mobile browser chrome.

### Summary

| File | Change |
|------|--------|
| `src/pages/ClientPortal.tsx` | Remove flex/overflow layout, use natural page scrolling for the cost breakdown view |

One file, 2 lines changed. The root cause is the constrained overflow container -- switching to natural scroll fixes it on all mobile browsers.
