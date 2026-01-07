# Gemini Inference Quick Reference

## Import

```typescript
import {
  extractLabelWithVision,
  extractBarcodeWithVision,
  inferUnitWeightFromPhoto,
  inferUnitsPerCaseFromBox,
  inferCustomsAndHS,
  getCategoryDefaults,
} from "@/lib/gemini-helper";
import crypto from "crypto";
```

## Basic Usage Pattern

```typescript
const requestId = crypto.randomUUID();
const result = await inferUnitWeightFromPhoto(imageUrl, labelUrl, requestId);

if (result.success) {
  const draft = result.unitWeightDraft;
  // Use draft: { value, unit, confidence, evidenceSnippet, source }
} else {
  console.error("Inference failed:", result.error);
  // Fallback to defaults
  const defaults = getCategoryDefaults(category);
  const draft = defaults.unitWeightDraft;
}
```

## All Functions

### 1. extractLabelWithVision

**Input**: `(imageDataUrl: string, requestId: string)`

**Output**: 
```typescript
{
  success: boolean;
  labelDraft?: {
    brand_name: { value: string | null, confidence: number, evidence: string },
    product_name: { value: string | null, confidence: number, evidence: string },
    net_weight_value: { value: number | null, confidence: number, evidence: string },
    net_weight_unit: { value: string | null, confidence: number, evidence: string },
    country_of_origin: { value: string | null, confidence: number, evidence: string },
    allergens_list: { value: string[] | null, confidence: number, evidence: string },
    ingredients_summary: { value: string | null, confidence: number, evidence: string }
  };
  error?: string;
}
```

### 2. extractBarcodeWithVision

**Input**: `(imageDataUrl: string, requestId: string)`

**Output**:
```typescript
{
  success: boolean;
  barcodeDraft?: {
    value: string | null,
    confidence: number,
    evidenceSnippet: string,
    source: "VISION"
  };
  error?: string;
}
```

### 3. inferUnitWeightFromPhoto

**Input**: `(productImageUrl: string, labelImageUrl?: string, requestId: string)`

**Output**:
```typescript
{
  success: boolean;
  unitWeightDraft?: {
    value: number,
    unit: string,
    confidence: number,
    evidenceSnippet: string,
    source: "VISION" | "DEFAULT"
  };
  error?: string;
}
```

### 4. inferUnitsPerCaseFromBox

**Input**: `(boxImageUrl: string | null, productName: string | null, category: string, requestId: string)`

**Output**:
```typescript
{
  success: boolean;
  unitsPerCaseDraft?: {
    candidates: Array<{
      value: number,
      confidence: number,
      evidenceSnippet: string
    }>,
    chosen: number | null,
    confirmed: boolean
  };
  error?: string;
}
```

### 5. inferCustomsAndHS

**Input**: `(productName: string | null, category: string | null, originCountry?: string, netWeight?: string, requestId: string)`

**Output**:
```typescript
{
  success: boolean;
  customsCategoryDraft?: {
    value: string,
    confidence: number,
    evidenceSnippet: string,
    source: "VISION"
  };
  hsCandidatesDraft?: Array<{
    code: string,
    confidence: number,
    rationale: string,
    evidenceSnippet: string
  }>;
  error?: string;
}
```

### 6. getCategoryDefaults

**Input**: `(category: string)`

**Output**:
```typescript
{
  unitWeightDraft: {
    value: number,
    unit: string,
    confidence: 0.25,
    evidenceSnippet: "Default assumption",
    source: "DEFAULT"
  },
  unitsPerCaseDraft: {
    candidates: [
      { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack" },
      { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack" }
    ],
    chosen: null,
    confirmed: false
  }
}
```

## Category Defaults

| Category     | Default Weight | Unit |
|--------------|----------------|------|
| candy        | 25             | g    |
| chocolate    | 25             | g    |
| beverage     | 250            | ml   |
| drink        | 250            | ml   |
| snack        | 30             | g    |
| supplement   | 5              | g    |
| generic      | 25             | g    |

## Confidence Scale

| Range     | Meaning                              |
|-----------|--------------------------------------|
| 1.0       | Clearly visible on label/barcode     |
| 0.7-0.9   | Partially visible or inferred        |
| 0.4-0.6   | Estimated from product type          |
| 0.25-0.3  | Category default                     |
| 0.0-0.2   | Not found                            |

## Environment Variables

Set **one** of these:
- `GEMINI_API_KEY` (preferred)
- `GOOGLE_API_KEY` (fallback)

## Runtime Configuration

For routes using Gemini, add:
```typescript
export const runtime = "nodejs";
```

## Error Handling

Always check `success` before using draft fields:

```typescript
const result = await inferUnitWeightFromPhoto(imageUrl, labelUrl, requestId);

if (!result.success) {
  // Log error
  console.error("Weight inference failed:", result.error);
  
  // Fallback to category defaults
  const defaults = getCategoryDefaults(category || "generic");
  weightDraft = defaults.unitWeightDraft;
  
  // Continue processing with default values
}
```

## Logging

All functions log with format:
```
[Gemini {requestId}] API key present, using model: gemini-1.5-flash
[Gemini {requestId}] Extracting label with Vision...
[Gemini {requestId}] Vision extraction succeeded
```

Errors:
```
[Gemini {requestId}] Vision Label Extraction Error: 403 unregistered callers
[Gemini {requestId}] No API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY.
```

## Database Persistence

Save draft fields as JSON:

```typescript
await supabase
  .from("reports")
  .update({
    label_draft: JSON.stringify(labelDraft),
    barcode_draft: JSON.stringify(barcodeDraft),
    weight_draft: JSON.stringify(unitWeightDraft),
    case_pack_draft: JSON.stringify(unitsPerCaseDraft),
    customs_category_draft: JSON.stringify(customsCategoryDraft),
    hs_candidates_draft: JSON.stringify(hsCandidatesDraft),
    label_confirmed: false,
    compliance_confirmed: false,
  })
  .eq("id", reportId);
```

## Reading from API

GET `/api/reports/{reportId}` returns:

```typescript
{
  success: true,
  report: {
    ...existing fields,
    _draft: {
      labelDraft: {...},
      barcodeDraft: {...},
      assumptionsDraft: {
        unitWeightDraft: {...},
        unitsPerCaseDraft: {...}
      },
      customsCategoryDraft: {...},
      hsDraft: [...], // HS code candidates
      complianceDraft: {...},
      labelConfirmed: false,
      complianceConfirmed: false
    }
  }
}
```

## Common Patterns

### Pattern 1: Extract Label, Fallback to Defaults

```typescript
const requestId = crypto.randomUUID();
const result = await extractLabelWithVision(labelUrl, requestId);

let originCountry = "Unknown";
let netWeight = "Unknown";

if (result.success && result.labelDraft) {
  originCountry = result.labelDraft.country_of_origin?.value || "Unknown";
  netWeight = result.labelDraft.net_weight_value?.value 
    ? `${result.labelDraft.net_weight_value.value} ${result.labelDraft.net_weight_unit?.value || ""}`
    : "Unknown";
} else {
  console.warn("Label extraction failed, using defaults");
}
```

### Pattern 2: Infer Weight, Handle Missing Image

```typescript
const requestId = crypto.randomUUID();

if (!productImageUrl) {
  // No image, use category defaults immediately
  const defaults = getCategoryDefaults(category);
  weightDraft = defaults.unitWeightDraft;
} else {
  const result = await inferUnitWeightFromPhoto(productImageUrl, labelImageUrl, requestId);
  
  if (result.success) {
    weightDraft = result.unitWeightDraft;
  } else {
    const defaults = getCategoryDefaults(category);
    weightDraft = defaults.unitWeightDraft;
  }
}
```

### Pattern 3: Batch Inference (Parallel)

```typescript
const requestId = crypto.randomUUID();

const [labelResult, barcodeResult, weightResult] = await Promise.all([
  extractLabelWithVision(labelUrl, requestId),
  extractBarcodeWithVision(barcodeUrl, requestId),
  inferUnitWeightFromPhoto(productUrl, labelUrl, requestId),
]);

// Handle each result independently
if (labelResult.success) { /* use labelDraft */ }
else { /* fallback */ }

if (barcodeResult.success) { /* use barcodeDraft */ }
else { /* fallback */ }

if (weightResult.success) { /* use weightDraft */ }
else { /* fallback */ }
```

### Pattern 4: Conditional Inference (Only If Missing)

```typescript
const requestId = crypto.randomUUID();

// Only infer if not already extracted by OCR
if (!existingBarcode && barcodeImageUrl) {
  const result = await extractBarcodeWithVision(barcodeImageUrl, requestId);
  
  if (result.success) {
    barcodeDraft = result.barcodeDraft;
    barcodeExtractionSource = "VISION";
    barcodeExtractionStatus = "DRAFT";
  } else {
    barcodeExtractionStatus = "FAILED";
  }
} else if (existingBarcode) {
  barcodeExtractionSource = "OCR";
  barcodeExtractionStatus = "CONFIRMED";
}
```

## Troubleshooting

### Issue: "403 unregistered callers"

**Cause**: API key not configured or incorrect

**Fix**:
1. Check `.env.local` has `GEMINI_API_KEY=your_key_here`
2. Restart dev server: `npm run dev`
3. Check logs for: `[Gemini {requestId}] API key present`

### Issue: All values show as defaults (confidence 0.25)

**Cause**: Vision inference failing, falling back to defaults

**Fix**:
1. Check logs for error messages
2. Verify image URLs are valid data URLs
3. Verify Gemini API quota not exceeded
4. Check image quality (must be readable)

### Issue: Database schema cache error

**Cause**: New columns added but Supabase not reloaded

**Fix**:
1. Run: `NOTIFY pgrst, 'reload schema'` in Supabase SQL editor
2. Or restart Supabase API
3. Or add columns with `IF NOT EXISTS` clause

### Issue: Draft fields not showing in UI

**Cause**: GET endpoint not returning `_draft` section

**Fix**:
1. Verify GET endpoint updated: `src/app/api/reports/[reportId]/route.ts`
2. Check response: `curl .../api/reports/{id} | jq '._draft'`
3. Verify database has draft fields saved

## Testing Checklist

- [ ] Test with GEMINI_API_KEY set
- [ ] Test with GOOGLE_API_KEY set (fallback)
- [ ] Test with no API key (should use defaults)
- [ ] Test with valid label image (should extract)
- [ ] Test with invalid image (should fallback)
- [ ] Test with missing image (should use defaults)
- [ ] Verify database persistence
- [ ] Verify GET endpoint returns _draft section
- [ ] Verify UI shows Draft badges
- [ ] Verify confidence pills show correct values
- [ ] Verify evidence tooltips work

## Related Files

- **Helper Module**: `src/lib/gemini-helper.ts`
- **Analyze Route**: `src/app/api/analyze/route.ts`
- **GET Report**: `src/app/api/reports/[reportId]/route.ts`
- **AssumptionsCard**: `src/components/report-v2/cards/AssumptionsCard.tsx`
- **EditAssumptionsModal**: `src/components/report-v2/modals/EditAssumptionsModal.tsx`
- **NextStepsCard**: `src/components/report-v2/cards/NextStepsCard.tsx`

## Documentation

- **Full Implementation**: `UNIFIED_GEMINI_IMPLEMENTATION.md`
- **Gating Removal**: `GATING_REMOVAL_IMPLEMENTATION.md`
- **Quick Setup**: `QUICK_SETUP.md`
