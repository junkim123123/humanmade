# Gemini Inference Quick Start

## What This Does

Extracts product data using Gemini Vision when OCR fails, with trust-safe gating:
- **Draft badges** on all AI-inferred values
- **Confidence scores** (0-100%, color-coded)
- **Evidence tooltips** (hover to see what Gemini saw)
- **3 critical fields** must be confirmed for compliance: origin, weight, allergens

## 1-Minute Setup

### Run Migration
```sql
-- In Supabase SQL Editor:
-- Run supabase/migrations/20251229_add_gemini_inference_fields.sql
```

### Verify Build
```bash
npm run build  # Should complete in ~6s with 0 errors
```

### Test Flow
1. Upload 3 photos to `/api/analyze`
2. Check response for `criticalConfirm`, `complianceStatus`, draft fields
3. Open report → should see "Confirm Critical Fields" button if incomplete
4. Click button → modal with pre-filled drafts
5. Submit confirmation → `complianceStatus` updates to `COMPLETE`

## Files to Integrate

### High Priority (Blocks user workflow)

**`src/components/report-v2/OverviewModern.tsx`**
```tsx
import ConfirmCriticalFieldsModal from "@/components/report-v2/modals/ConfirmCriticalFieldsModal";

// Add state
const [showConfirmModal, setShowConfirmModal] = useState(false);

// Show trigger when incomplete
{report.complianceStatus !== "COMPLETE" && (
  <button onClick={() => setShowConfirmModal(true)}>
    Confirm Critical Fields
  </button>
)}

// Render modal
{showConfirmModal && (
  <ConfirmCriticalFieldsModal 
    report={report}
    onClose={() => setShowConfirmModal(false)}
    onSuccess={() => {
      setShowConfirmModal(false);
      // Refresh report data
    }}
  />
)}
```

**`src/components/report-v2/cards/DecisionCard.tsx`**
```tsx
import { DraftChip, ConfidencePill, EvidenceTooltip } from "@/components/ui/draft-primitives";

// Show compliance status
{report.complianceStatus === "INCOMPLETE" && (
  <div className="text-amber-600">
    ⚠️ Confirm critical fields to complete compliance check
  </div>
)}

// Show HS candidates with Draft UI
{report.hsCandidatesDraft?.map(candidate => (
  <div key={candidate.code}>
    <DraftChip />
    <span>{candidate.code}</span>
    <ConfidencePill confidence={candidate.confidence} />
    <EvidenceTooltip evidence={candidate.rationale}>
      <InfoIcon />
    </EvidenceTooltip>
  </div>
))}
```

**`src/components/report-v2/cards/WhatWeKnowCard.tsx`**
```tsx
import { DraftFieldRow } from "@/components/ui/draft-primitives";

// Show draft fields
{report.customsCategoryDraft && (
  <DraftFieldRow
    label="Customs Category"
    value={report.customsCategoryDraft.value}
    confidence={report.customsCategoryDraft.confidence}
    evidence={report.customsCategoryDraft.evidenceSnippet}
  />
)}
```

### Medium Priority (Improves supplier leads)

**Supplier matching** (`src/lib/intelligence-pipeline.ts` or similar)
- Add type classifier: Manufacturer, Importer, Trading, Logistics, Unknown
- Always return up to 5 candidates (never hide even when weak)
- Show logistics under separate "Other entities" section

## Confidence Color Guide

| Confidence | Color | Meaning |
|------------|-------|---------|
| ≥80% | Emerald 🟢 | High confidence (clear visibility) |
| 50-79% | Amber 🟡 | Medium confidence (partially visible) |
| <50% | Slate ⚪ | Low confidence (inferred/guessed) |

## Compliance Status

| Status | When | Action |
|--------|------|--------|
| **INCOMPLETE** | Any critical field unconfirmed | Show "Confirm Critical Fields" button |
| **PRELIMINARY** | All confirmed but low confidence (<80%) | Show warning: "Double-check accuracy" |
| **COMPLETE** | All confirmed with high confidence (≥80%) | Show green checkmark |

## API Endpoints

### Analyze
```bash
POST /api/analyze
# Returns criticalConfirm, barcodeDraft, weightDraft, casePackDraft, 
# customsCategoryDraft, hsCandidatesDraft, complianceStatus
```

### Confirm Critical Fields
```bash
POST /api/reports/[reportId]/confirm-critical
Body: {
  "originCountry": "China",
  "netWeight": "500 g",
  "allergens": "Milk, Soy"
}
# Returns updated complianceStatus
```

## Draft UI Primitives

```tsx
import { 
  DraftChip,           // Amber "Draft" badge
  ConfidencePill,      // Colored percentage
  EvidenceTooltip,     // Hover snippet
  DraftFieldRow,       // Complete row (label + value + badges + tooltip)
  DraftSection         // Container for grouped drafts
} from "@/components/ui/draft-primitives";

// Simple usage
<DraftFieldRow
  label="Country of Origin"
  value="China"
  confidence={0.85}
  evidence="Product of China visible on label"
/>
```

## Common Patterns

### Check if field is draft
```typescript
const isDraft = !report.criticalConfirm?.originCountry?.confirmed;
```

### Show confidence-based message
```typescript
if (confidence >= 0.8) {
  return "High confidence - likely accurate";
} else if (confidence >= 0.5) {
  return "Medium confidence - please verify";
} else {
  return "Low confidence - best guess";
}
```

### Extract draft value
```typescript
const originCountry = 
  report.criticalConfirm?.originCountry?.value || 
  "Unknown";
```

## Non-Negotiable Rules

1. ✅ **Always show Draft chip** on unconfirmed values
2. ✅ **Always show confidence** (percentage + color)
3. ✅ **Always show evidence** (hover tooltip)
4. ❌ **Never claim "complete"** until 3 critical fields confirmed
5. ❌ **Never hide supplier candidates** (even when weak)

## Troubleshooting

### "Schema cache" error
```sql
NOTIFY pgrst, 'reload schema';
```
Or restart API server.

### Vision extraction not running
Check `GOOGLE_API_KEY` in `.env.local`.

### Confidence always 0
Gemini returned null values - check image quality or prompt.

### Build fails
```bash
npm run build
```
Should show specific TypeScript errors.

## Next Actions

1. **Run migration** in Supabase
2. **Integrate ConfirmCriticalFieldsModal** into OverviewModern
3. **Add Draft UI to DecisionCard** for HS candidates
4. **Show draft fields** in WhatWeKnowCard
5. **Update supplier matching** to always show candidates

See [GEMINI_INFERENCE_IMPLEMENTATION.md](./GEMINI_INFERENCE_IMPLEMENTATION.md) for full details.
