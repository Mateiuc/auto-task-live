

## Fix: VIN OCR Candidate Extraction Not Finding Valid VIN

### The Problem

From your screenshot, the OCR correctly reads:
```
vn 1FMCU0HDXJUB10441
```

But it says "No 17-char candidates found". The issue is in **how Tesseract processes the raw text**.

---

### Root Cause Analysis

**In `tesseractVinOcr.ts` line 56:**
```typescript
const lines = cleanedText.split(/[\n\s]+/).filter(line => line.length >= 17);
```

This splits by both spaces AND newlines, creating individual words. The VIN "1FMCU0HDXJUB10441" becomes a single "word" of 17 characters, which should pass the filter.

**However**, the issue is in `cleanText()` at line 23:
```typescript
.replace(/[^A-HJ-NPR-Z0-9\s\n]/g, '')
```

This removes **I, O, Q** (invalid VIN chars), but the OCR might be:
1. Reading "0" (zero) as "O" (letter) - which gets stripped
2. Reading other characters with diacritics that get converted incorrectly

The real issue: **The OCR might be outputting a VIN with mixed O/0 confusion that gets partially stripped, breaking the 17-char count.**

---

### The Fix

**1. Improve character normalization BEFORE filtering** - Convert common OCR mistakes to valid VIN chars:
   - `O` → `0` (letter O to zero)
   - `I` → `1` (letter I to one)  
   - `Q` → `0` (letter Q to zero)

**2. Join adjacent alphanumeric tokens** - The word "vn" followed by the VIN might be getting concatenated incorrectly

**3. Add sliding window search on the FULL cleaned text** - Not just on split lines

---

### Implementation Changes

**File: `src/lib/tesseractVinOcr.ts`**

```typescript
// Enhanced cleanText function
const cleanText = (text: string): string => {
  return text
    .toUpperCase()
    // Convert common OCR misreads to valid VIN characters
    .replace(/[OÖ]/g, '0')     // Letter O → Zero (O is invalid in VIN)
    .replace(/[IÏ]/g, '1')     // Letter I → One (I is invalid in VIN)
    .replace(/Q/g, '0')        // Q → Zero (Q is invalid in VIN)
    .replace(/Ü/g, 'U')
    .replace(/Ä/g, 'A')
    .replace(/[^A-HJ-NPR-Z0-9\s\n]/g, '')
    .trim();
};
```

**Also update the candidate search logic** to:
1. First try the split-by-space approach (current)
2. **Also** search the entire cleaned text as one string with a sliding window
3. Remove all whitespace from the cleaned text and scan for 17-char sequences

```typescript
// After cleaning, also try joining all text and scanning
const fullText = cleanedText.replace(/[\s\n]+/g, ''); // Remove all whitespace
for (let i = 0; i <= fullText.length - 17; i++) {
  const potentialVin = fullText.substring(i, i + 17);
  // ... validate and add to candidates
}
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/lib/tesseractVinOcr.ts` | 1. Add O→0, I→1, Q→0 conversions in cleanText<br>2. Add full-text sliding window search |
| `src/lib/ocrSpaceVinOcr.ts` | Add same O→0, I→1, Q→0 conversions for consistency |

This ensures that even if OCR reads "1FMCU0HDXJUB10441" with an "O" instead of "0", it will still be found and validated.

