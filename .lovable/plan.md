

## Fix Price and Quantity Input Fields - Remove Sticky "0" Problem

### Problem
When adding parts in the Complete Work dialog (and Edit Task dialog), the price field starts with `0`. On mobile, you can't easily clear it -- you end up typing in front of the zero (e.g., "120" becomes "1200"). The same issue affects the quantity field.

### Root Cause
The inputs use `value={newPart.price}` with a numeric value that defaults to `0`. Combined with `type="number"`, the `0` stays in the field and can't be naturally cleared by the user.

### Solution
Switch the price and quantity inputs to use **string state** so the field can be empty, and only convert to a number when saving. When the user focuses the field and the value is `0`, auto-clear it.

### Changes

**File: `src/components/CompleteWorkDialog.tsx`**

1. Change `newPart.price` and `newPart.quantity` to store as **strings** internally (`''` instead of `0` / `1`)
2. Use `value={newPart.price}` as string -- empty string shows placeholder, not "0"
3. On `onFocus`, if value is "0", clear it
4. On `onBlur`, if value is empty, reset to default ("0" for price, "1" for quantity)
5. Only convert to number when the "Add Part" button is clicked
6. Same approach for the quantity field

Specifically:
- Change initial state: `price: 0` becomes `price: ''` (display as empty with placeholder)
- Add `placeholder="0.00"` to price and `placeholder="1"` to quantity
- On change: store raw string value
- On handleAddPart: parse to number with fallbacks

**File: `src/components/EditTaskDialog.tsx`**

Apply the same fix to the part price input in the edit dialog (line ~630):
- On focus: select all text so user can type over it
- Use `onFocus={(e) => e.target.select()}` so tapping the field selects the "0" and typing replaces it

### Summary

| File | Change |
|------|--------|
| `src/components/CompleteWorkDialog.tsx` | Use empty string defaults + placeholders for price/quantity inputs |
| `src/components/EditTaskDialog.tsx` | Add `onFocus` select-all behavior to price input |

