

## Client Portal - Separate Access View for Each Client

### Overview
Create a dedicated, read-only client portal page where clients can view their detailed cost breakdown. The mechanic shares a link with an access code, and the client opens it on any device or the mechanic's device.

### How It Works

Since the app stores data locally on the mechanic's device, the portal works in two modes:

1. **On-device mode**: The mechanic opens the client view on their own device and hands it to the client (most common use case)
2. **Share mode**: When sharing a link, the app encodes the client data into the URL so it works on any device without needing access to local storage

### Access Flow

```text
Mechanic                              Client
   |                                     |
   |-- Sets PIN for client (optional) ---|
   |                                     |
   |-- Shares link + code via SMS ------>|
   |   OR hands phone to client          |
   |                                     |
   |                              [Enter PIN code]
   |                                     |
   |                              [View cost breakdown]
```

### New Files to Create

**1. `src/pages/ClientPortal.tsx`** - Main client portal page
- PIN entry screen (4-digit code)
- After PIN verified, shows read-only cost breakdown
- Displays: client name, each vehicle with sessions, labor hours, labor cost, parts list with prices, and grand total
- Clean, professional look suitable for showing clients
- No edit controls, no timer controls - purely informational
- Back button to return to main app (for on-device mode)

**2. `src/components/ClientCostBreakdown.tsx`** - Reusable cost display component
- Vehicle cards showing year/make/model/VIN
- Per-session breakdown: description, date, duration, labor cost
- Parts table: name, quantity, unit price, total
- Summary section: total labor, total parts, grand total
- Status badges (completed, billed, paid)

**3. `src/lib/clientPortalUtils.ts`** - Utility functions
- `generateAccessCode()`: Creates a random 4-digit PIN
- `encodeClientData()`: Compresses client+tasks data for URL sharing
- `decodeClientData()`: Decompresses data from URL
- `calculateClientCosts()`: Computes all cost breakdowns for a client

### Files to Modify

**4. `src/App.tsx`** - Add route
- Add `/client/:clientId` route for on-device portal
- Add `/client-view` route for shared data portal (data in URL hash)

**5. `src/types/index.ts`** - Add client access settings
- Add `accessCode?: string` field to Client type

**6. `src/components/ManageClientsDialog.tsx`** - Add portal controls
- Add "Set Access Code" button per client
- Add "Share Portal Link" button per client
- Show/generate access code

**7. `src/components/TaskCard.tsx`** - Add share portal option
- Add "Share Client Portal" option in the dropdown menu for completed/billed tasks

### Client Portal Page Layout

```text
+----------------------------------+
|  [Back]   Client Portal    [Logo]|
+----------------------------------+
|                                  |
|  Enter Access Code               |
|  [_] [_] [_] [_]                |
|                                  |
|  [View My Costs]                 |
|                                  |
+----------------------------------+

        After PIN entry:

+----------------------------------+
|  [Back]   Client Portal          |
+----------------------------------+
|  Hello, John Smith               |
|                                  |
|  --- 2024 Toyota Camry --------- |
|  VIN: 1HGBH41JXMN109186         |
|                                  |
|  Session 1 - Jan 15, 2025        |
|  "Oil change and brake check"    |
|  Duration: 01:30                 |
|  Labor: $112.50                  |
|                                  |
|  Parts:                          |
|  Oil Filter    1 x $12.99       |
|  Brake Pads    2 x $45.00       |
|  Parts Total: $102.99            |
|                                  |
|  --- Session Total: $215.49 ---- |
|                                  |
|  ================================|
|  TOTAL LABOR:    $112.50         |
|  TOTAL PARTS:    $102.99         |
|  GRAND TOTAL:    $215.49         |
|  Status: Billed                  |
+----------------------------------+
```

### Data Sharing Approach

For cross-device sharing (when client opens on their own phone):
- Client data (tasks, sessions, parts, costs) is JSON-serialized, compressed, and base64-encoded into the URL hash
- The `/client-view` route reads and decodes this data
- No server needed - all data travels in the URL
- URLs may be long but work reliably for typical task counts

For on-device viewing (mechanic hands phone):
- Simple route `/client/:clientId` reads from local storage
- PIN verification before showing data
- Clean separation from the main app interface

### Technical Details

**Cost Calculation Logic (`clientPortalUtils.ts`):**
```typescript
interface ClientCostSummary {
  vehicles: Array<{
    vehicle: Vehicle;
    sessions: Array<{
      description: string;
      date: Date;
      duration: number;
      laborCost: number;
      parts: Part[];
      partsCost: number;
      status: TaskStatus;
    }>;
    totalLabor: number;
    totalParts: number;
    vehicleTotal: number;
  }>;
  grandTotalLabor: number;
  grandTotalParts: number;
  grandTotal: number;
}
```

**URL Data Encoding:**
- Serialize relevant client data to JSON
- Compress using built-in `CompressionStream` API (gzip)
- Base64-encode for URL safety
- Place in URL hash: `https://app.url/client-view#encodedData`

**Access Code Storage:**
- Stored as `accessCode` field on the Client object
- 4-digit numeric PIN (e.g., "4829")
- Generated randomly, can be regenerated anytime
- Displayed to mechanic for sharing with client

### Summary of All Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/ClientPortal.tsx` | Create | PIN screen + cost breakdown page |
| `src/components/ClientCostBreakdown.tsx` | Create | Reusable cost display component |
| `src/lib/clientPortalUtils.ts` | Create | Access code, data encoding, cost calculation |
| `src/App.tsx` | Modify | Add two new routes |
| `src/types/index.ts` | Modify | Add accessCode to Client |
| `src/components/ManageClientsDialog.tsx` | Modify | Add portal controls |
| `src/components/TaskCard.tsx` | Modify | Add share portal menu option |

