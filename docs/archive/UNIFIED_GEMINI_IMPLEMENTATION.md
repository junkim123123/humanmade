# Unified Gemini Implementation

## Overview

This document describes the implementation of a unified Gemini inference system that addresses the "Vision 403 unregistered callers" issue and provides comprehensive draft field tracking throughout the data model.

## Problem Statement

**Known Issue**: Gemini text inference can work but Vision inference fails with "403 unregistered callers" error when:
- Using different API key sources
- Inconsistent client creation patterns
- No fallback when Vision fails

**Solution**: Create a unified Gemini helper module with:
- Single API key handling (GEMINI_API_KEY or GOOGLE_API_KEY)
- Consistent error handling and logging
- Comprehensive fallback to category defaults
- Standardized draft field structure

## Architecture

### 1. Unified Gemini Helper Module

**File**: `src/lib/gemini-helper.ts` (484 lines)

**Core Functions**:
- `createGeminiClient()` - Checks GEMINI_API_KEY or GOOGLE_API_KEY, logs key presence
- `extractLabelWithVision(imageDataUrl, requestId)` - Returns labelDraft with all fields
- `extractBarcodeWithVision(imageDataUrl, requestId)` - Returns barcodeDraft
- `inferUnitWeightFromPhoto(imageDataUrl, labelDataUrl?, requestId)` - Returns unitWeightDraft
- `inferUnitsPerCaseFromBox(boxImageUrl, productName, category, requestId)` - Returns unitsPerCaseDraft with candidates
- `inferCustomsAndHS(productName, category, originCountry?, netWeight?, requestId)` - Returns customsCategoryDraft + hsCandidatesDraft
- `getCategoryDefaults(category)` - Returns safe defaults when all inference fails

**API Key Handling**:
```typescript
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error(`[Gemini ${requestId}] No API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY.`);
  return { success: false, error: "No API key configured" };
}
console.log(`[Gemini ${requestId}] API key present, using model: gemini-1.5-flash`);
```

**Draft Field Structure**:
All draft fields follow this consistent structure:
```typescript
{
  value: any,
  confidence: number, // 0.0-1.0
  evidenceSnippet: string, // Max 50 chars
  source: "VISION" | "OCR" | "USER" | "DEFAULT"
}
```

**Category Defaults**:
When all inference fails, return category-specific defaults:
- Candy: 25g (confidence 0.25)
- Beverage: 250ml (confidence 0.25)
- Snack: 30g (confidence 0.25)
- Supplement: 5g (confidence 0.25)
- Generic: 25g (confidence 0.25)

**Case Pack Defaults**:
```typescript
[
  { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack" },
  { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack" }
]
```

**Confidence Scale**:
- `1.0` = Clearly visible on label/barcode
- `0.7-0.9` = Partially visible or inferred from context
- `0.4-0.6` = Estimated from product type or weak evidence
- `0.25-0.3` = Category default
- `0.0-0.2` = Not found

### 2. Analyze Route Integration

**File**: `src/app/api/analyze/route.ts`

**Changes**:
1. Removed 6 old inline Gemini functions (lines 26-318 deleted)
2. Updated imports to use gemini-helper module
3. Added `geminiRequestId` for request logging
4. Updated all function calls to use helper module
5. Added `label_confirmed` and `compliance_confirmed` fields to database update

**Runtime Declaration**:
```typescript
// Force Node.js runtime to avoid edge runtime issues with admin client and Gemini
export const runtime = "nodejs";
```

**Database Fields Persisted**:
```typescript
{
  label_draft: JSON.stringify(labelDraft),
  label_extraction_source: "VISION" | "OCR",
  label_extraction_status: "CONFIRMED" | "DRAFT" | "FAILED",
  label_vision_extraction_attempted: boolean,
  label_vision_extraction_at: ISO timestamp,
  label_confirmed: false, // Always false initially
  compliance_confirmed: false, // Always false initially
  barcode_draft: JSON.stringify(barcodeDraft),
  barcode_extraction_source: "OCR" | "VISION" | "NONE",
  barcode_extraction_status: "CONFIRMED" | "DRAFT" | "FAILED" | "NONE",
  weight_draft: JSON.stringify(weightDraft),
  case_pack_draft: JSON.stringify(casePackDraft),
  customs_category_draft: JSON.stringify(customsCategoryDraft),
  hs_candidates_draft: JSON.stringify(hsCandidatesDraft),
  compliance_status: string,
  compliance_notes: JSON.stringify(notes),
  critical_confirm: JSON.stringify(criticalConfirm)
}
```

### 3. GET Report Endpoint

**File**: `src/app/api/reports/[reportId]/route.ts`

**Changes**:
Added `_draft` section to response payload:
```typescript
_draft: {
  labelDraft: { // originCountry, netWeight, allergens, brand, productName
    country_of_origin: { value, confidence, evidence },
    net_weight_value: { value, confidence, evidence },
    net_weight_unit: { value, confidence, evidence },
    allergens_list: { value, confidence, evidence },
    brand_name: { value, confidence, evidence },
    product_name: { value, confidence, evidence },
    ingredients_summary: { value, confidence, evidence }
  },
  barcodeDraft: {
    value: string,
    confidence: number,
    evidenceSnippet: string,
    source: string
  },
  assumptionsDraft: {
    unitWeightDraft: {
      value: number,
      unit: string,
      confidence: number,
      evidenceSnippet: string,
      source: string
    },
    unitsPerCaseDraft: {
      candidates: [
        { value: number, confidence: number, evidenceSnippet: string }
      ],
      chosen: number | null,
      confirmed: boolean
    }
  },
  customsCategoryDraft: {
    value: string,
    confidence: number,
    evidenceSnippet: string,
    source: string
  },
  hsDraft: [ // Array of HS code candidates
    {
      code: string,
      confidence: number,
      rationale: string,
      evidenceSnippet: string
    }
  ],
  complianceDraft: {
    status: string,
    notes: string[]
  },
  labelConfirmed: boolean,
  complianceConfirmed: boolean
}
```

## Usage Examples

### 1. Extracting Label with Vision

```typescript
import { extractLabelWithVision } from "@/lib/gemini-helper";

const requestId = crypto.randomUUID();
const result = await extractLabelWithVision(labelImageDataUrl, requestId);

if (result.success) {
  const labelDraft = result.labelDraft;
  // labelDraft contains:
  // - brand_name: { value, confidence, evidence }
  // - product_name: { value, confidence, evidence }
  // - net_weight_value: { value, confidence, evidence }
  // - net_weight_unit: { value, confidence, evidence }
  // - country_of_origin: { value, confidence, evidence }
  // - allergens_list: { value, confidence, evidence }
  // - ingredients_summary: { value, confidence, evidence }
} else {
  console.error("Vision extraction failed:", result.error);
  // Fallback to getCategoryDefaults(category)
}
```

### 2. Inferring Unit Weight

```typescript
import { inferUnitWeightFromPhoto } from "@/lib/gemini-helper";

const requestId = crypto.randomUUID();
const result = await inferUnitWeightFromPhoto(productImageDataUrl, labelImageDataUrl, requestId);

if (result.success) {
  const weightDraft = result.unitWeightDraft;
  // weightDraft: { value: 500, unit: "g", confidence: 0.8, evidenceSnippet: "Net Wt. 500g visible", source: "VISION" }
} else {
  // Use category default
  const defaults = getCategoryDefaults("candy");
  const weightDraft = defaults.unitWeightDraft;
  // weightDraft: { value: 25, unit: "g", confidence: 0.25, evidenceSnippet: "Default assumption", source: "DEFAULT" }
}
```

### 3. Inferring Case Pack

```typescript
import { inferUnitsPerCaseFromBox } from "@/lib/gemini-helper";

const requestId = crypto.randomUUID();
const result = await inferUnitsPerCaseFromBox(boxImageDataUrl, productName, category, requestId);

if (result.success) {
  const casePackDraft = result.unitsPerCaseDraft;
  // casePackDraft: {
  //   candidates: [
  //     { value: 12, confidence: 0.9, evidenceSnippet: "12 units printed on box" },
  //     { value: 24, confidence: 0.4, evidenceSnippet: "Alternative case size" }
  //   ],
  //   chosen: null,
  //   confirmed: false
  // }
}
```

### 4. Inferring Customs and HS Codes

```typescript
import { inferCustomsAndHS } from "@/lib/gemini-helper";

const requestId = crypto.randomUUID();
const result = await inferCustomsAndHS(productName, category, originCountry, netWeight, requestId);

if (result.success) {
  const customsCategoryDraft = result.customsCategoryDraft;
  // customsCategoryDraft: { value: "Food & Beverages", confidence: 0.9, evidenceSnippet: "Snack food", source: "VISION" }
  
  const hsCandidatesDraft = result.hsCandidatesDraft;
  // hsCandidatesDraft: [
  //   { code: "210690", confidence: 0.8, rationale: "Food preparations", evidenceSnippet: "Snack category" },
  //   { code: "190590", confidence: 0.6, rationale: "Bread, pastry, cakes", evidenceSnippet: "Baked goods" }
  // ]
}
```

### 5. Getting Category Defaults

```typescript
import { getCategoryDefaults } from "@/lib/gemini-helper";

const defaults = getCategoryDefaults("beverage");
// Returns:
// {
//   unitWeightDraft: { value: 250, unit: "ml", confidence: 0.25, evidenceSnippet: "Default assumption", source: "DEFAULT" },
//   unitsPerCaseDraft: {
//     candidates: [
//       { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack" },
//       { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack" }
//     ],
//     chosen: null,
//     confirmed: false
//   }
// }
```

## Error Handling

All functions follow the same error handling pattern:

```typescript
try {
  // Attempt inference
  return { success: true, [draftField]: result };
} catch (error: any) {
  console.error(`[Gemini ${requestId}] ${functionName} Error:`, error.message);
  return { success: false, error: error.message };
}
```

Callers should always check `success` and fallback to defaults:

```typescript
const result = await inferUnitWeightFromPhoto(imageUrl, labelUrl, requestId);
if (!result.success) {
  const defaults = getCategoryDefaults(category);
  weightDraft = defaults.unitWeightDraft;
}
```

## Logging

All Gemini calls log with a consistent format:

```
[Gemini {requestId}] API key present, using model: gemini-1.5-flash
[Gemini {requestId}] Extracting label with Vision...
[Gemini {requestId}] Vision Label Extraction Error: 403 unregistered callers
```

This allows easy filtering and debugging in production logs.

## Database Schema

### New Columns in `reports` Table

```sql
-- Confirmation flags
ALTER TABLE reports ADD COLUMN label_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN compliance_confirmed BOOLEAN DEFAULT FALSE;

-- Draft fields (JSON)
ALTER TABLE reports ADD COLUMN label_draft JSONB;
ALTER TABLE reports ADD COLUMN barcode_draft JSONB;
ALTER TABLE reports ADD COLUMN weight_draft JSONB;
ALTER TABLE reports ADD COLUMN case_pack_draft JSONB;
ALTER TABLE reports ADD COLUMN customs_category_draft JSONB;
ALTER TABLE reports ADD COLUMN hs_candidates_draft JSONB;

-- Extraction metadata
ALTER TABLE reports ADD COLUMN label_extraction_source TEXT;
ALTER TABLE reports ADD COLUMN label_extraction_status TEXT;
ALTER TABLE reports ADD COLUMN label_vision_extraction_attempted BOOLEAN;
ALTER TABLE reports ADD COLUMN label_vision_extraction_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN barcode_extraction_source TEXT;
ALTER TABLE reports ADD COLUMN barcode_extraction_status TEXT;

-- Compliance
ALTER TABLE reports ADD COLUMN compliance_status TEXT;
ALTER TABLE reports ADD COLUMN compliance_notes JSONB;
ALTER TABLE reports ADD COLUMN critical_confirm JSONB;
```

## UI Integration

### 1. AssumptionsCard (Already Implemented)

Displays draft assumptions with confidence indicators:
- Unit weight: "25 g" + `<Draft />` badge + confidence pill (0.25) + evidence tooltip
- Units per case: "12 units" + `<Draft />` badge + confidence pill (0.4) + evidence tooltip
- "Edit assumptions" button opens EditAssumptionsModal

### 2. EditAssumptionsModal (Already Implemented)

Form to update assumptions:
- Unit weight (grams)
- Units per case (number)
- Calls `POST /api/reports/[reportId]/update-assumptions`
- Sets source=MANUAL, confidence=1.0, confirmed=true

### 3. NextStepsCard (Already Implemented)

Always shows supplier section:
- Non-logistics suppliers → "Supplier candidates" (show up to 3)
- Only logistics → "Other entities" section with explanation
- No matches → "No leads yet" + actions (RFQ, verification, search)

## Pending Work

### 1. Supplier Type Classifier UI

**Status**: Not started

**Requirements**:
- Read `supplier.flags.supplierType` from matches
- Map to user-facing labels: Manufacturer, Importer, Trading, Logistics, Unknown
- Show type badge on each supplier card
- Filter logistics to "Other entities" section
- Never headline logistics as supplier lead
- Show Trading with Draft badge

**Implementation**:
```typescript
// In NextStepsCard or SupplierMatchCard
const typeLabel = match.flags.supplierType === "manufacturer" ? "Manufacturer" :
                  match.flags.supplierType === "importer" ? "Importer" :
                  match.flags.supplierType === "trading" ? "Trading" :
                  match.flags.supplierType === "logistics" ? "Logistics" :
                  "Unknown";

const showDraft = match.flags.supplierType === "trading";
```

### 2. Compliance Gating with labelConfirmed

**Status**: Not started

**Requirements**:
- In OverviewModern or compliance display component
- If `labelConfirmed === false`, show status "Incomplete"
- Show message: "Preliminary. Confirm label details for compliance completeness."
- Add ConfirmLabelModal with 3 fields: Origin country, Net weight, Allergens
- On submit, call `POST /api/reports/[reportId]/confirm-label` endpoint
- Endpoint sets `label_confirmed: true`, `compliance_confirmed: true` (if all 3 provided with high confidence)

**Implementation**:
```typescript
// In compliance card
if (!report._draft?.labelConfirmed) {
  return (
    <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-900">Incomplete</p>
          <p className="text-sm text-yellow-700">
            Preliminary. Confirm label details for compliance completeness.
          </p>
        </div>
      </div>
      <Button onClick={() => setShowConfirmLabelModal(true)}>
        Confirm Label Details
      </Button>
    </div>
  );
}
```

## Testing

### 1. Test Gemini API Key Handling

```bash
# Test with GEMINI_API_KEY
export GEMINI_API_KEY=your_key_here
npm run dev

# Test with GOOGLE_API_KEY
unset GEMINI_API_KEY
export GOOGLE_API_KEY=your_key_here
npm run dev

# Test with no key (should log error and fallback)
unset GEMINI_API_KEY
unset GOOGLE_API_KEY
npm run dev
```

### 2. Test Vision Fallback

```bash
# Upload product with label image
# If Vision fails, should fallback to category defaults
# Check logs for: "[Gemini {requestId}] Vision Label Extraction Error: ..."
# Check report data for: weightDraft with source="DEFAULT"
```

### 3. Test Draft Field Persistence

```bash
# Upload product
# Check database: SELECT label_draft, weight_draft, case_pack_draft FROM reports WHERE id = ...;
# Verify JSON structure matches expected format
```

### 4. Test GET Endpoint Draft Section

```bash
curl http://localhost:3000/api/reports/{reportId} | jq '._draft'
# Should return:
# {
#   "labelDraft": {...},
#   "barcodeDraft": {...},
#   "assumptionsDraft": {...},
#   "customsCategoryDraft": {...},
#   "hsDraft": [...],
#   "complianceDraft": {...},
#   "labelConfirmed": false,
#   "complianceConfirmed": false
# }
```

## Migration Notes

### Existing Reports

Reports created before this implementation:
- Will have `null` values for all new draft fields
- `label_confirmed` and `compliance_confirmed` will default to `false`
- UI should handle gracefully with "No data" or "Run analysis again"

### Database Migration

Add columns with:
```sql
ALTER TABLE reports ADD COLUMN IF NOT EXISTS label_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS compliance_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS label_draft JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS barcode_draft JSONB;
-- ... (see Database Schema section for full list)
```

## Conclusion

This unified Gemini implementation provides:
1. ✅ Single API key handling (GEMINI_API_KEY or GOOGLE_API_KEY)
2. ✅ Consistent error handling and logging with requestId
3. ✅ Comprehensive fallback to category defaults
4. ✅ Standardized draft field structure across all inference
5. ✅ Database persistence of all draft fields
6. ✅ GET endpoint returning draft section
7. ⚠️ Pending: Supplier type classifier UI
8. ⚠️ Pending: Compliance gating with labelConfirmed

**Build Status**: ✅ Compiles successfully (0 TypeScript errors)

**Next Steps**:
1. Implement supplier type classifier badges in UI
2. Implement compliance gating with ConfirmLabelModal
3. Add database migration for new columns
4. Test in production with real Gemini API key
