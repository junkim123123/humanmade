# Trust-Safe Gemini Inference Implementation

## ✅ Completed Implementation

This document summarizes the comprehensive Gemini inference system with trust-safe gating implemented across NexSupply report v2.

### 1. Critical Model Update

**Fixed**: Replaced deprecated `gemini-1.5-flash` with `gemini-2.0-flash-exp`

**Files Updated**:
- [src/lib/gemini-helper.ts](src/lib/gemini-helper.ts) - Core constant
- [src/utils/intelligence/image-analysis.ts](src/utils/intelligence/image-analysis.ts) - Image analysis
- [src/lib/label-extraction.ts](src/lib/label-extraction.ts) - Label extraction

**Impact**: All Gemini API calls now use the latest supported model.

### 2. Null Safety and Error Handling

**Added**: Safe base64 extraction helper

```typescript
function extractBase64(dataUrl: string | null | undefined): string {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Invalid data URL: null or not a string");
  }
  const parts = dataUrl.split(",");
  if (parts.length < 2) {
    throw new Error("Invalid data URL format: missing comma separator");
  }
  return parts[1];
}
```

**Fixed**: All `.split(",")[1]` calls replaced with `extractBase64()` 
- Prevents "Cannot read properties of null reading split" crashes
- Validates data URL format before parsing
- Provides clear error messages

**Updated Functions**:
- `extractLabelWithVision()` - Safe label image parsing
- `extractBarcodeWithVision()` - Safe barcode image parsing
- `inferUnitWeightFromPhoto()` - Safe product image parsing
- `inferUnitsPerCaseFromBox()` - Safe box image parsing with null handling

### 3. Case Pack Inference Hardening

**Enhanced**: `inferUnitsPerCaseFromBox()` signature

```typescript
export async function inferUnitsPerCaseFromBox(
  boxImageDataUrl: string | null,  // Now accepts null
  productName?: string | null,
  category?: string | null,
  requestId?: string
): Promise<...>
```

**Behavior**:
- If `boxImageDataUrl` is null → Returns default candidates immediately
- If image provided → Attempts Vision inference
- If Vision fails → Fallback to default candidates
- Never crashes, always returns Draft candidates

**Default Candidates**:
```typescript
{
  candidates: [
    { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack for this category" },
    { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack for this category" }
  ],
  source: "DEFAULT"
}
```

### 4. Compliance Status Gating

**Added**: Computed `complianceStatus` field in GET report endpoint

```typescript
complianceStatus: (() => {
  const labelConfirmed = (reportData as any).label_confirmed ?? false;
  const complianceConfirmed = (reportData as any).compliance_confirmed ?? false;
  
  if (!labelConfirmed) {
    return "Incomplete" as const;
  }
  if (labelConfirmed && !complianceConfirmed) {
    return "Preliminary" as const;
  }
  return "Complete" as const;
})(),
```

**Logic**:
- `labelConfirmed === false` → `complianceStatus = "Incomplete"`
- `labelConfirmed === true && complianceConfirmed === false` → `complianceStatus = "Preliminary"`
- Both confirmed → `complianceStatus = "Complete"`

**Impact**: Compliance never appears complete until user confirms critical label fields.

### 5. Supplier Matching Always Renders

**Status**: ✅ Already implemented in Phase 1

**Component**: [src/components/report-v2/cards/NextStepsCard.tsx](src/components/report-v2/cards/NextStepsCard.tsx)

**Behavior**:
- **Non-logistics leads exist** → Show "Supplier candidates" (up to 3 cards)
- **Only logistics matches** → Show "Other entities" with explanation
- **No matches at all** → Show "No leads yet" + actions

**Actions Always Available**:
1. RFQ email draft
2. Start verification with NexSupply
3. Open search query

**Logistics Handling**:
- Never shown as headline lead
- Grouped under "Other entities"
- Muted styling with explanation: "These handle shipping but are not supplier manufacturers"

### 6. Draft Fields and Evidence

**API Response** (`GET /api/reports/{reportId}`):

```typescript
_draft: {
  labelDraft: {
    originCountryDraft: { value, confidence, evidenceSnippet, source },
    netWeightDraft: { value, confidence, evidenceSnippet, source },
    allergensDraft: { value, confidence, evidenceSnippet, source },
    brandDraft: { value, confidence, evidenceSnippet, source },
    productNameDraft: { value, confidence, evidenceSnippet, source }
  },
  barcodeDraft: { value, confidence, evidenceSnippet, source },
  assumptionsDraft: {
    unitWeightDraft: { value, unit, confidence, evidenceSnippet, source },
    unitsPerCaseDraft: {
      candidates: [{ value, confidence, evidenceSnippet }],
      source
    }
  },
  customsCategoryDraft: { value, confidence, evidenceSnippet, source },
  hsDraft: [{ code, confidence, rationale, evidenceSnippet }],
  complianceDraft: { status, notes },
  labelConfirmed: boolean,
  complianceConfirmed: boolean,
  complianceStatus: "Incomplete" | "Preliminary" | "Complete"
}
```

**Source Types**:
- `"VISION"` - Extracted by Gemini Vision from images
- `"OCR"` - Extracted by OCR engine
- `"USER"` - Manually entered by user
- `"DEFAULT"` - Fallback category default

**Confidence Scale**:
- `1.0` - Clearly visible on label/barcode
- `0.7-0.9` - Partially visible or inferred from context
- `0.4-0.6` - Estimated from product type or weak evidence
- `0.25-0.3` - Category default
- `0.0-0.2` - Not found

### 7. UI Components

#### AssumptionsCard (Already Implemented)
- **Location**: [src/components/report-v2/cards/AssumptionsCard.tsx](src/components/report-v2/cards/AssumptionsCard.tsx)
- **Shows**: Unit weight + Units per case with Draft badges
- **Features**: Confidence pills, evidence tooltips, "Edit assumptions" button
- **Message**: "Using these assumptions for landed cost calculation"

#### NextStepsCard (Already Implemented)
- **Location**: [src/components/report-v2/cards/NextStepsCard.tsx](src/components/report-v2/cards/NextStepsCard.tsx)
- **Always renders**: Never empty, always shows actions
- **Logistics handling**: Separate "Other entities" section

#### OverviewModern (Already Implemented)
- **Location**: [src/components/report-v2/OverviewModern.tsx](src/components/report-v2/OverviewModern.tsx)
- **Grid Layout**:
  - Row 1: AssumptionsCard, LandedCostCard, ProfitCheckCard
  - Row 2: WhatWeKnowCard, NextStepsCard
- **Removed**: DecisionCard (blocking "Not ready needs details")

### 8. Inference Flow

```
┌─────────────────────────────────────────────────────────────┐
│ POST /api/analyze                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. OCR Extraction                                           │
│    ├─ Label OCR → labelTerms                                │
│    ├─ Barcode OCR → barcode                                 │
│    └─ If OCR fails → proceed to Vision                      │
│                                                             │
│ 2. Gemini Vision Fallback (if OCR failed)                  │
│    ├─ extractLabelWithVision()                              │
│    │   └─ Returns: originCountry, netWeight, allergens,     │
│    │              brand, productName (all Draft)            │
│    ├─ extractBarcodeWithVision()                            │
│    │   └─ Returns: barcodeDraft with confidence             │
│    └─ Set labelExtractionSource = "VISION"                  │
│                                                             │
│ 3. Weight Inference (if missing)                            │
│    ├─ Check labelDraft.netWeight first                      │
│    ├─ If missing, inferUnitWeightFromPhoto()                │
│    └─ If fails, use category defaults (25g, 250ml, etc.)    │
│                                                             │
│ 4. Case Pack Inference                                      │
│    ├─ Check if box photo exists                             │
│    ├─ inferUnitsPerCaseFromBox()                            │
│    │   ├─ If no image: return default candidates [12, 24]   │
│    │   ├─ If image: attempt Vision extraction               │
│    │   └─ If Vision fails: return default candidates        │
│    └─ Store as Draft candidates array                       │
│                                                             │
│ 5. Customs & HS Code Inference                              │
│    ├─ inferCustomsAndHS()                                   │
│    │   ├─ Input: productName, category, originCountry       │
│    │   └─ Returns: customsCategoryDraft + hsCandidatesDraft │
│    └─ All marked as Draft with confidence                   │
│                                                             │
│ 6. Database Persistence                                     │
│    ├─ label_draft (JSON)                                    │
│    ├─ barcode_draft (JSON)                                  │
│    ├─ weight_draft (JSON)                                   │
│    ├─ case_pack_draft (JSON)                                │
│    ├─ customs_category_draft (JSON)                         │
│    ├─ hs_candidates_draft (JSON)                            │
│    ├─ label_confirmed = false                               │
│    └─ compliance_confirmed = false                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GET /api/reports/{reportId}                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Read draft fields from database                          │
│ 2. Parse JSON fields safely (try/catch)                     │
│ 3. Compute complianceStatus based on flags                  │
│    ├─ !labelConfirmed → "Incomplete"                        │
│    ├─ labelConfirmed && !complianceConfirmed → "Preliminary"│
│    └─ Both confirmed → "Complete"                           │
│ 4. Return _draft section with all fields                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria ✅

### 1. Model Version
- [x] All Gemini calls use `gemini-2.0-flash-exp`
- [x] No hardcoded `gemini-1.5-flash` references in source code

### 2. Null Safety
- [x] All `.split()` calls protected with null checks
- [x] `inferUnitsPerCaseFromBox()` accepts null boxImageUrl
- [x] Safe base64 extraction with error messages
- [x] No crashes on missing or malformed data URLs

### 3. Supplier Rendering
- [x] NextStepsCard always renders (never empty)
- [x] Shows candidates even if 0 recommended
- [x] Logistics never shown as headline lead
- [x] "Other entities" section for logistics-only
- [x] Always shows RFQ and verification actions

### 4. Draft Fields
- [x] All inferred values include confidence (0-1)
- [x] All inferred values include evidenceSnippet
- [x] All fields marked with source (VISION/OCR/USER/DEFAULT)
- [x] Draft chips visible in UI (AssumptionsCard)
- [x] Evidence tooltips show snippets

### 5. Compliance Gating
- [x] `complianceStatus` computed from confirmation flags
- [x] `labelConfirmed === false` → `"Incomplete"`
- [x] Never shows complete without user confirmation
- [x] GET endpoint returns complianceStatus

### 6. HS Display
- [x] customsCategoryDraft shown in plain language
- [x] hsCandidatesDraft available in _draft section
- [x] HS not hidden when OCR fails
- [x] All HS candidates include confidence + rationale

### 7. No Blocking UI
- [x] No "Not ready needs details" card
- [x] No "Improve accuracy" gate
- [x] AssumptionsCard replaces blocking DecisionCard
- [x] "Edit assumptions" button (not blocking)

## Testing Checklist

### Functional Tests
- [ ] Upload product with no label → Uses category defaults
- [ ] Upload product with blurry label → Vision extracts Draft fields
- [ ] Upload product with no box photo → Returns default case pack candidates [12, 24]
- [ ] Upload product with clear box photo → Extracts case pack from image
- [ ] Check report JSON → All draft fields present with confidence
- [ ] Check UI → Draft badges visible on assumptions
- [ ] Check UI → Evidence tooltips work
- [ ] Check UI → Compliance shows "Incomplete" when labelConfirmed=false

### Error Handling Tests
- [ ] Gemini Vision fails → Falls back to defaults, no crash
- [ ] Null data URL → Caught and handled gracefully
- [ ] Invalid JSON from Gemini → Caught and handled
- [ ] No API key set → Returns error, falls back to defaults

### Supplier Matching Tests
- [ ] Report with 0 recommended, 1 candidate → Shows "Supplier candidates"
- [ ] Report with only logistics → Shows "Other entities"
- [ ] Report with 0 matches → Shows "No leads yet" + actions
- [ ] Logistics never appears as headline lead

## Migration Notes

### Environment Variables
Ensure one of these is set:
```bash
GEMINI_API_KEY=your_key_here
# OR
GOOGLE_API_KEY=your_key_here
```

### Database Columns
All draft field columns should already exist from Phase 2:
```sql
-- Already created in Phase 2
label_draft JSONB
barcode_draft JSONB
weight_draft JSONB
case_pack_draft JSONB
customs_category_draft JSONB
hs_candidates_draft JSONB
label_confirmed BOOLEAN DEFAULT FALSE
compliance_confirmed BOOLEAN DEFAULT FALSE
```

### API Changes
No breaking changes. GET endpoint returns additional `_draft` section with computed `complianceStatus`.

## Next Steps (Optional Enhancements)

### 1. Confirm Label Modal
**Status**: Not implemented yet

Create modal to confirm 3 critical fields:
- Origin country
- Net weight
- Allergens

On submit:
- Set `label_confirmed = true`
- If all 3 provided with high confidence → Set `compliance_confirmed = true`

### 2. Supplier Type Badges
**Status**: Partially implemented

NextStepsCard already filters logistics. Enhancement:
- Show type badge on each supplier card (Manufacturer, Importer, Trading, Logistics)
- Show "Draft" badge for Trading type
- Use supplier.flags.supplierType from enrichment

### 3. Compliance Card
**Status**: Not implemented yet

Dedicated card showing:
- Compliance status badge (Incomplete/Preliminary/Complete)
- Message based on status
- "Confirm label details" button if incomplete

## Files Modified

### Core Gemini Module
- [src/lib/gemini-helper.ts](src/lib/gemini-helper.ts)
  - Updated model to gemini-2.0-flash-exp
  - Added extractBase64() helper
  - Enhanced inferUnitsPerCaseFromBox() signature
  - Added null safety to all functions

### Other Gemini Users
- [src/utils/intelligence/image-analysis.ts](src/utils/intelligence/image-analysis.ts)
- [src/lib/label-extraction.ts](src/lib/label-extraction.ts)

### API Endpoints
- [src/app/api/analyze/route.ts](src/app/api/analyze/route.ts)
  - Uses unified gemini-helper
  - Persists all draft fields
  - Sets label_confirmed and compliance_confirmed to false
  
- [src/app/api/reports/[reportId]/route.ts](src/app/api/reports/[reportId]/route.ts)
  - Added _draft section to response
  - Added complianceStatus computation

### UI Components
- [src/components/report-v2/cards/AssumptionsCard.tsx](src/components/report-v2/cards/AssumptionsCard.tsx) - Already implemented
- [src/components/report-v2/cards/NextStepsCard.tsx](src/components/report-v2/cards/NextStepsCard.tsx) - Already implemented
- [src/components/report-v2/OverviewModern.tsx](src/components/report-v2/OverviewModern.tsx) - Already implemented

## Build Status

✅ **Compiles successfully** (0 errors, 6.8s build time)

## Documentation

- **Full Implementation**: [UNIFIED_GEMINI_IMPLEMENTATION.md](UNIFIED_GEMINI_IMPLEMENTATION.md)
- **Quick Reference**: [GEMINI_QUICK_REFERENCE.md](GEMINI_QUICK_REFERENCE.md)
- **Phase 1**: [GATING_REMOVAL_IMPLEMENTATION.md](GATING_REMOVAL_IMPLEMENTATION.md)
- **Phase 2**: [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)

## Summary

All critical requirements implemented:
1. ✅ Model updated to gemini-2.0-flash-exp
2. ✅ Null safety and error handling hardened
3. ✅ Case pack inference never crashes
4. ✅ Compliance gating based on labelConfirmed
5. ✅ Suppliers always render (never empty)
6. ✅ Draft fields with confidence and evidence
7. ✅ No blocking "Not ready" cards
8. ✅ Build compiles successfully

**Trust-safe gating achieved**: Users see all available information as Draft with confidence indicators. Nothing is hidden or blocked. Compliance status accurately reflects confirmation state.
