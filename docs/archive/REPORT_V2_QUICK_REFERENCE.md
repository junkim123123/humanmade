# Report V2 Always-Ready: Quick Reference

## What Changed?

### 🎯 Goal Achieved
Report v2 now shows useful results **always**, with Draft values instead of "Not Ready" gates or empty states.

---

## 6 Major Changes

### 1️⃣ Unified Gemini Wrapper
**File:** `src/lib/gemini/unified-service.ts`

```typescript
import { generateJson, generateText, safeJsonParse } from '@/lib/gemini/unified-service';

// Generate text (never throws)
const result = await generateText("Analyze this product...");
if (result.success) {
  console.log(result.text);
}

// Generate JSON (with safe parsing)
const jsonResult = await generateJson("...", schema);
if (jsonResult.success) {
  console.log(jsonResult.data);
}
```

**Benefits:**
- ✅ Single entry point for all LLM calls
- ✅ Automatic model fallback (2.5 flash → lite → 1.5)
- ✅ Safe JSON parsing (handles markdown)
- ✅ Never throws; always returns structured `{ success, data, error }`

---

### 2️⃣ Draft Inference with Smart Defaults
**File:** `src/lib/draft-inference-builder.ts`

```typescript
import { createDefaultDraftInference } from '@/lib/draft-inference-builder';

// In analyze API
const category = analysis.category || "product";
const draftInference = createDefaultDraftInference(category);

// Result: All fields have value + confidence + source
{
  weightDraft: { value: 25, unit: "g", confidence: 20, source: "DEFAULT" },
  casePackDraft: { value: [120, 240, 480], confidence: 15, source: "DEFAULT" },
  // ... etc
}
```

**Category Defaults:**
| Category | Weight | Case Packs |
|----------|--------|-----------|
| Candy | 25g | [120, 240, 480] |
| Beverage | 250g | [24, 30, 48] |
| Electronics | 400g | [10, 20, 50] |
| Fans | 1200g | [5, 10, 20] |
| Other | 50g | [12, 24, 48] |

---

### 3️⃣ Backfill for Old Reports
**File:** `src/app/api/reports/[reportId]/route.ts`

```typescript
// Old reports auto-generate draftInference on GET
if (!draftInference || Object.keys(draftInference).length === 0) {
  const category = reportData.category || "product";
  draftInference = createDefaultDraftInference(category);
  console.log(`[Reports API] Backfilled draftInference for ${reportId}`);
}
```

**Result:** No broken old reports; seamless upgrade.

---

### 4️⃣ UI: Always Show Draft Values
**Files:**
- `src/components/report-v2/cards/AssumptionsCard.tsx` ✅ Already shows Draft
- `src/components/report-v2/ReportV2CostModel.tsx` ✅ Labels "Factory unit price estimate"
- `src/components/report-v2/cards/NextStepsCard.tsx` ✅ Always shows suppliers or "No leads"

**What You See:**
```
┌─────────────────────────────────┐
│ Assumptions used                │
├─────────────────────────────────┤
│ Unit weight: 25g [Draft]        │ ← Draft badge always visible
│ Units per case: 120 units [D]   │
└─────────────────────────────────┘
```

---

### 5️⃣ Supplier Section Always Renders
**Component:** `src/components/report-v2/cards/NextStepsCard.tsx`

**Three States:**
1. **With leads** → Show up to 3 manufacturers
2. **Logistics only** → Show info box + grayed logistics
3. **No matches** → "No leads yet" + RFQ/search buttons

**Key:** Never empty/hidden. Always actionable.

---

### 6️⃣ Simplified Navigation
**File:** `src/components/PrimaryNav.tsx`

```
Dashboard | Analyze | Reports | Orders    [More▼] [+ New analysis]
                                          └─ Inbox
                                          └─ Admin (if admin)
                                          └─ Help
                                          └─ Sign Out
```

**Changes:**
- ✅ 4 primary tabs (was 6)
- ✅ Secondary items in dropdown
- ✅ New analysis button prominent
- ✅ Mobile responsive

---

## Key Behaviors

### Draft Badges Appear When:
- Value from category default (confidence < 30)
- Value inferred from Vision (not user-confirmed)
- Value from Gemini (unverified)

### Compliance Status:
- Never "Complete"
- Always "Preliminary" after label confirmed
- Always "Incomplete" if label not confirmed
- Shows as draft snapshot, not verified state

### Landed Cost Calculation:
- Uses draft FOB unit prices
- Calculates independently (no shelf price contamination)
- Shows standard & conservative scenarios
- All components clearly labeled

---

## Testing Checklist (5 min)

```bash
# 1. Upload product with bad label
npm run dev
# Go to /analyze, upload blurry/missing label image

# 2. View report
# Open /reports/{id}

# 3. Verify (checkbox each)
☐ See AssumptionsCard with unit weight + Draft badge
☐ See cost breakdown with "Factory unit price estimate"
☐ See NextStepsCard with suppliers or "No leads yet"
☐ Compliance status is "Preliminary" (not Complete)
☐ Navigation shows 4 primary tabs + More dropdown

# 4. Test old report backfill
# Find old report from before this feature
# Open GET /api/reports/{old_id}
# Check draftInference is auto-populated
```

---

## Code Examples

### Using Unified Gemini Wrapper

```typescript
import { generateJson } from '@/lib/gemini/unified-service';

const result = await generateJson(
  "Analyze this product: " + productDescription,
  schema,
  { requestId: "req-123" }
);

if (result.success) {
  console.log("Model used:", result.modelUsed); // e.g., "gemini-2.5-flash"
  console.log("Data:", result.data);
} else {
  console.warn("Error:", result.error);
  // Handle gracefully - report doesn't block
}
```

### Using Draft Inference Builder

```typescript
import { createDefaultDraftInference, mergeDraftInference } from '@/lib/draft-inference-builder';

// Create defaults
const defaults = createDefaultDraftInference("candy");

// Override with Gemini result
const merged = mergeDraftInference(defaults, {
  weightDraft: {
    value: 30,
    confidence: 75,
    evidenceSnippet: "Inferred from product dimensions",
    source: "GEMINI"
  }
});

// Result: defaults + Gemini overrides
```

### Rendering Draft Badge

```tsx
{!isConfirmed && <DraftChip />}
// or
<span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
  Draft
</span>
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Gemini calls failing | Check env `GEMINI_API_KEY` is set |
| Draft values not showing | Verify `draftInference` in API response |
| Old report broken | Backfill runs automatically; clear cache |
| Navigation dropdown closed | Click backdrop also closes (intended) |
| Admin items visible to non-admin | Check user role context in PrimaryNav |

---

## Files at a Glance

```
NEW FILES:
├─ src/lib/gemini/unified-service.ts (378 lines)
│  └─ Unified wrapper for all LLM calls
└─ src/lib/draft-inference-builder.ts (141 lines)
   └─ Default draftInference with category logic

MODIFIED:
├─ src/app/api/analyze/route.ts
│  └─ Initialize draftInference with defaults
├─ src/app/api/reports/[reportId]/route.ts
│  └─ Backfill draftInference on old reports
└─ src/components/PrimaryNav.tsx
   └─ 4 tabs + More dropdown + New analysis button

DOCUMENTS:
├─ REPORT_V2_IMPLEMENTATION_SUMMARY.md
│  └─ Full technical summary
└─ REPORT_V2_ALWAYS_READY_VERIFICATION.md
   └─ Comprehensive test checklist
```

---

## Next Steps

1. **Test in dev:** Follow 5-min checklist above
2. **Check logs:** Verify no errors in console/terminal
3. **Test old report:** Confirm backfill works
4. **Test edge cases:** No matches, logistics only, etc.
5. **Deploy:** All changes are non-breaking

---

## Questions?

- **Gemini wrapper:** See `src/lib/gemini/unified-service.ts` comments
- **Draft defaults:** See `src/lib/draft-inference-builder.ts` comments
- **Navigation:** See `src/components/PrimaryNav.tsx` code
- **Full testing:** See `REPORT_V2_ALWAYS_READY_VERIFICATION.md`

---

**Status:** ✅ All 6 tasks complete, ready for testing
