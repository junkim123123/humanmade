# Report V2 Always-Ready Experience - Verification Checklist

## Overview
The report v2 experience now always shows useful results without blocking on missing inputs. Compliance shows as draft, draft numeric estimates appear everywhere, and navigation is simplified.

---

## Task 1: Unified Gemini Wrapper ✅

### Files Created
- [x] `src/lib/gemini/unified-service.ts` - Single entry point for all LLM calls

### Verification Steps
```bash
# Check unified service exports
grep -n "export async function" src/lib/gemini/unified-service.ts

# Verify no new hardcoded models
grep -r "gemini-1.5-flash" src/lib/gemini/ --exclude-dir=node_modules || echo "✓ No hardcoded 1.5-flash"

# Test safe JSON parsing
node -e "const {safeJsonParse} = require('./src/lib/gemini/unified-service'); console.log(safeJsonParse('{\"test\":1}').success)"
```

### Expected Output
- ✅ Service exports: `generateText`, `generateJson`, `generateImageAnalysis`, `safeJsonParse`
- ✅ Uses env `GEMINI_API_KEY` and optional `GEMINI_MODEL`
- ✅ No hardcoded model versions in unified service
- ✅ Safe JSON parsing handles markdown code fences
- ✅ All functions return structured results, never throw

---

## Task 2: Draft Inference Always Exists ✅

### Files Created/Modified
- [x] `src/lib/draft-inference-builder.ts` - Default draft inference with category-aware defaults
- [x] `src/app/api/analyze/route.ts` - Uses default draftInference

### Verification Steps

**1. Check analyze API initializes draft correctly:**
```bash
# Verify import is present
grep "createDefaultDraftInference" src/app/api/analyze/route.ts

# Run analyze with test image
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@test.jpg" \
  -F "barcode=@barcode.jpg" \
  -F "label=@label.jpg" \
  2>/dev/null | jq '.report.draftInference | keys'
```

Expected response should have keys:
- ✅ `labelDraft` (with originCountryDraft, netWeightDraft, allergensDraft, brandDraft, productNameDraft)
- ✅ `barcodeDraft`
- ✅ `weightDraft` (with unit "g" and numeric default)
- ✅ `casePackDraft` (with candidates array)
- ✅ `customsCategoryDraft`
- ✅ `hsCandidatesDraft`

**2. Verify category-aware defaults:**
- Candy product → weightDraft.value = 25 (grams)
- Beverage product → weightDraft.value = 250 (ml)
- Electronics product → weightDraft.value = 400 (grams)
- Unknown category → weightDraft.value = 50 (grams)

---

## Task 3: Backfill draftInference on GET ✅

### Files Modified
- [x] `src/app/api/reports/[reportId]/route.ts` - Backfill logic added

### Verification Steps

**1. Test old report without draftInference:**
```bash
# Fetch an old report (created before draftInference feature)
curl -s http://localhost:3000/api/reports/{REPORT_ID} | jq '.report.draftInference | keys'
```

Expected: Even old reports show draftInference with defaults (not empty)

**2. Check console logs for backfill:**
```
[Reports API] Backfilled draftInference for old report {id} (category: {category})
```

---

## Task 4: Remove Not Ready Card ✅

### Verification Steps

**1. Load report:**
```bash
# Open http://localhost:3000/reports/{REPORT_ID}
```

**2. Verify UI:**
- ✅ No yellow "Not ready, needs details" card appears
- ✅ AssumptionsCard always visible showing:
  - Unit weight (with Draft badge if not confirmed)
  - Units per case (with Draft badge if not confirmed)
- ✅ Edit assumptions button available
- ✅ ConfidencePill shows low confidence (0.2–0.4) for defaults
- ✅ Compliance status shows "Preliminary" (never "Complete")

**3. Check LandedCostCard:**
- ✅ Shows "Factory unit price estimate" with Draft badge
- ✅ No "Missing inputs" chips
- ✅ No "Improve accuracy" CTA button

---

## Task 5: Supplier Section Always Renders ✅

### Verification Steps

**1. Report with supplier candidates:**
```bash
# Open report with matches
curl -s http://localhost:3000/api/reports/{REPORT_ID} | jq '.report._supplierMatches | length'
```

Expected: NextStepsCard shows up to 3 candidates with:
- ✅ Supplier name (clickable Google search link)
- ✅ Supplier type badge (Manufacturer, Trading, Importer)
- ✅ Evidence snippet
- ✅ "Draft" badge on Trading companies (not aggressively cleaned)

**2. Report with no matches:**
```bash
# Open report with zero candidates
```

Expected: NextStepsCard shows:
- ✅ "No leads yet" message
- ✅ RFQ email draft button (always visible)
- ✅ "Start verification" button (always visible)
- ✅ Open search button (always visible)

**3. Report with only logistics matches:**
Expected: NextStepsCard shows:
- ✅ Info box: "We found logistics-related entities, not factories"
- ✅ Logistics matches displayed (up to 3)
- ✅ Actions still visible and functional

---

## Task 6: Navigation Simplification ✅

### Files Modified
- [x] `src/components/PrimaryNav.tsx` - 4 main tabs + More dropdown

### Verification Steps

**1. Visual Navigation:**
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard  Analyze  Reports  Orders    More  [New analysis] │
└─────────────────────────────────────────────────────────┘
```

**2. Check 4 primary tabs:**
- ✅ Dashboard (/)
- ✅ Analyze (/analyze)
- ✅ Reports (/reports)
- ✅ Orders (/projects)

**3. Check More dropdown:**
Click "More" button:
- ✅ Inbox (/inbox)
- ✅ Admin (/admin) - only if user has admin role
- ✅ Help (/learn)
- ✅ Sign Out (bottom, separate)

**4. Check New Analysis button:**
- ✅ Blue button on right side
- ✅ Leads to /analyze
- ✅ Always visible

**5. Mobile responsiveness:**
- ✅ Primary tabs scroll horizontally if needed
- ✅ More dropdown accessible on small screens

---

## Integration Tests

### Test 1: Complete Analyze → Report Flow

```bash
# 1. Upload product
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@candy.jpg" \
  -F "barcode=@barcode.jpg" \
  -F "label=@label.jpg" \
  > response.json

REPORT_ID=$(jq -r '.reportId' response.json)

# 2. Fetch report (test backfill)
curl -s http://localhost:3000/api/reports/$REPORT_ID | jq '{
  hasDraftInference: (.report.draftInference != null),
  hasComplianceStatus: (.report.draftInference.complianceDraft != null),
  weightDraftExists: (.report.draftInference.weightDraft != null),
  casePackExists: (.report.draftInference.casePackDraft != null)
}'
```

Expected:
```json
{
  "hasDraftInference": true,
  "hasComplianceStatus": true,
  "weightDraftExists": true,
  "casePackExists": true
}
```

### Test 2: OCR Failure → Gemini Fallback

```bash
# Upload blurry/low-quality image
# Check logs for:
# [Analyze API] OCR failed, attempting Vision label extraction...
# [Analyze API] Vision extraction succeeded, draft created
```

Expected: draftInference.labelDraft populated with Vision results

### Test 3: No Supplier Matches

```bash
# Analyze unusual/niche product
# Result: No supplier matches
# Open report → NextStepsCard shows "No leads yet"
# With RFQ email, verification, and search buttons
```

### Test 4: Old Report Backfill

```bash
# Find report from before draftInference feature
# Fetch with GET /api/reports/{id}
# Verify draftInference is auto-generated
# Check console for "[Reports API] Backfilled draftInference"
```

---

## UI Rendering Checklist

### AssumptionsCard (Always Visible)
- [ ] Shows "Assumptions used" header
- [ ] Edit assumptions button works
- [ ] Unit weight row: value + Draft badge (if not confirmed)
- [ ] Units per case row: value + Draft badge (if not confirmed)
- [ ] Confidence pills show low values for defaults
- [ ] Evidence tooltips show sources

### LandedCostCard
- [ ] Title: "Factory unit price estimate" with Draft badge
- [ ] Shows Standard and Conservative cost breakdowns
- [ ] Unit price line always labeled "Factory unit price estimate"
- [ ] No "Missing inputs" chips
- [ ] No "Improve accuracy" CTA (only "Edit assumptions")

### NextStepsCard
- [ ] Supplier section always present
- [ ] Either shows candidates OR "No leads yet" message
- [ ] RFQ email button always visible
- [ ] Verification button always visible
- [ ] Search button always visible
- [ ] Raw evidence lines unchanged

### Report Header
- [ ] Compliance status: "Preliminary" (never "Complete")
- [ ] No status chips show "Complete"
- [ ] Draft badges visible on inferred fields

### Navigation
- [ ] Primary nav: Dashboard, Analyze, Reports, Orders
- [ ] More dropdown contains: Inbox, Admin (if admin), Help
- [ ] New analysis button on right
- [ ] Mobile: tabs scroll, More dropdown works

---

## Performance Checks

```bash
# Build check
npm run build 2>&1 | grep -i "error\|warning" | head -20

# TypeScript check
npx tsc --noEmit

# Linting
npm run lint src/lib/gemini/unified-service.ts
npm run lint src/lib/draft-inference-builder.ts
npm run lint src/components/PrimaryNav.tsx
```

Expected: No errors or critical warnings

---

## Rollback Plan

If issues arise:

1. **Gemini wrapper issues:**
   - Revert `src/lib/gemini/unified-service.ts`
   - Falls back to individual service files

2. **Draft inference issues:**
   - Remove `createDefaultDraftInference` calls
   - Reports will show empty `draftInference` (old behavior)

3. **Navigation issues:**
   - Revert `PrimaryNav.tsx` to original version
   - Restores 6-item navigation

---

## Sign-Off

- [ ] All 6 main tasks completed
- [ ] No TypeScript errors
- [ ] No console errors in dev
- [ ] AssumptionsCard renders correctly
- [ ] Navigation simplified to 4 + dropdown
- [ ] Old reports backfill draftInference
- [ ] Unified Gemini wrapper in place
- [ ] Report v2 shows Draft values always

**Date Completed:** _____________
**Tester Name:** _____________
