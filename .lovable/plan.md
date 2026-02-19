

## Fix: Large Data URL Problem for Client Portal Sharing

### Problem
When a client has many vehicles and sessions, the compressed+base64 data in the URL hash can exceed limits imposed by messaging apps (WhatsApp ~2KB, SMS ~1600 chars) or even some browsers (~64KB). Links get truncated and break.

### Solution: Two-Part Fix

**Part 1 -- Slim the payload (reduce size by ~50-60%)**

Strip unnecessary data before encoding. The current payload includes full `Vehicle` objects (with `id`, `clientId`), full `Client` objects, and `Part.description`. The portal display only needs display-friendly fields.

Create a minimal "wire format" in `clientPortalUtils.ts`:
- Vehicle: only keep `vin`, `make`, `model`, `year`, `color` (drop `id`, `clientId`)
- Client: only keep `name` (drop `id`, `email`, `phone`, `hourlyRate`, `accessCode`, `createdAt`)
- Sessions: keep `description`, `date`, `duration`, `laborCost`, `parts`, `partsCost`, `status` (already minimal)
- Parts: keep `name`, `quantity`, `price` (drop `description`)

Add a new `encodeClientDataSlim()` function that maps `ClientCostSummary` to this minimal format before compressing.

**Part 2 -- Fallback to file sharing when URL is too long**

After encoding, check the URL length. If it exceeds a safe threshold (2000 characters), instead of copying a URL:
- Generate a small self-contained HTML file with the data embedded
- Use the **Web Share API** (`navigator.share()` with a file) to let the mechanic send it via WhatsApp, email, etc.
- The HTML file opens in the client's browser and renders the cost breakdown directly
- If Share API is unavailable, fall back to downloading the file

### Changes

| File | Change |
|------|--------|
| `src/lib/clientPortalUtils.ts` | Add minimal wire format types, `slimDown()` helper to strip unnecessary fields before encoding, and update `encodeClientData` to use it. Add `generatePortalHtmlFile()` that creates a self-contained HTML string with embedded data |
| `src/pages/ClientPortal.tsx` | Update `decodeClientData` usage to handle the slim format (map back to `ClientCostSummary`) |
| `src/components/ManageClientsDialog.tsx` | After encoding, check URL length. If under 2000 chars, copy URL as before. If over, use Share API to share the generated HTML file. Show appropriate toast messages for each path |

### Technical Details

**Slim format example:**
```text
Before: { client: { id, name, email, phone, hourlyRate, accessCode, createdAt }, vehicles: [{ vehicle: { id, clientId, vin, make, model, year, color }, sessions: [...] }] }

After:  { n: "John", v: [{ vin, mk, md, yr, cl, s: [{ d: "Oil change", dt: 1708300800, dur: 3600, lc: 75, pc: 45, st: "completed", p: [{ n: "Filter", q: 1, pr: 15 }] }] }], tl: 150, tp: 90, gt: 240 }
```

**URL length check flow:**
```text
1. Generate slim payload + compress + base64
2. Build URL string
3. If URL.length <= 2000 --> copy to clipboard (current behavior)
4. If URL.length > 2000 --> generate HTML file --> share via Share API or download
```

**Self-contained HTML file:**
- Minimal HTML page with inline CSS (no external deps)
- Data embedded as a JSON script tag
- Simple JS renders the cost breakdown table
- Works offline once opened
- PIN verification included in the HTML

