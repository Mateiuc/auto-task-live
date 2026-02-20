

## Database-Backed Client Portal with Cloud Photo Storage

### Prerequisites

**Enable Lovable Cloud** -- one-click setup that creates a managed Supabase backend. This must be done first before any code changes.

---

### Part 1: Database Schema and Storage

**Migration 1 -- `client_portals` table:**

```text
client_portals
  id              text (PK, 8-char nanoid)
  client_local_id text (unique, maps to local client ID)
  client_name     text
  access_code     text (4-digit PIN)
  data            jsonb (slim cost breakdown payload)
  updated_at      timestamptz (default now())
```

RLS: Public SELECT (PIN-protected in app). Writes via edge function with service role key.

**Migration 2 -- `session-photos` storage bucket:**

Public bucket for work session photos, with a 5MB file size limit.

---

### Part 2: Edge Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `sync-portal` | POST | Upserts client portal data into `client_portals`, returns portal `id` |
| `get-portal` | GET `?id=xxx` | Fetches portal data by short ID |
| `upload-photo` | POST | Receives base64 photo, uploads to storage bucket, returns public URL |

---

### Part 3: Type Updates

**`src/types/index.ts`:**
- Add `portalId?: string` to `Client` interface
- Add `cloudUrl?: string` to `SessionPhoto` interface

---

### Part 4: Cloud Sync Logic

**`src/lib/clientPortalUtils.ts`:**
- Add `syncPortalToCloud(clientId, summary, accessCode)` -- calls `sync-portal` edge function, returns portal ID
- Add `fetchPortalFromCloud(portalId)` -- calls `get-portal` edge function
- Extend `SlimSession` wire format with `photos` array (cloud URLs)

**`src/services/photoStorageService.ts`:**
- Add `uploadPhotoToCloud(base64, taskId, photoId)` -- calls `upload-photo`, returns public URL

---

### Part 5: Auto-Sync Triggers

**`src/pages/Index.tsx`:**
- After `handleCompleteWork` saves locally, call `syncPortalToCloud` in background
- After photo capture, call `uploadPhotoToCloud` in background, save returned URL to `SessionPhoto.cloudUrl`
- All cloud calls fail silently if offline

---

### Part 6: Sharing with Short URLs

**`src/components/ManageClientsDialog.tsx`:**
- "Share Link" now generates `https://yourdomain.com/client-view?id=k7x2m9pq`
- If no `portalId` yet, triggers sync first
- Falls back to hash/file method if sync fails

---

### Part 7: Client Portal View

**`src/pages/ClientPortal.tsx`:**
- Priority order: `?id=` (fetch from cloud) then `#hash` (legacy) then `/client/:id` (on-device)
- All three paths continue to work

**`src/components/ClientCostBreakdown.tsx`:**
- Render photos from `cloudUrl` when present

---

### Part 8: Photo Compression

Photos compressed client-side before upload (resize to 800px max, 70% JPEG quality) to maximize the 1GB storage limit.

---

### Implementation Order

1. Enable Lovable Cloud
2. Create database table + RLS policies
3. Create storage bucket
4. Build 3 edge functions (sync-portal, get-portal, upload-photo)
5. Update types
6. Add cloud sync utilities
7. Wire up auto-sync in Index.tsx
8. Update sharing dialog for short URLs
9. Update ClientPortal.tsx for cloud fetch
10. Add photo display to ClientCostBreakdown
11. Add photo compression

### Backward Compatibility

- Old `#hash` links keep working
- HTML file fallback still available
- Local storage remains source of truth
- Cloud sync fails silently if offline

