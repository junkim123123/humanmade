## Leads Quality Improvements - Quick Start Guide

### What Changed?

Three major improvements to supplier leads quality:

1. **🚫 Auto-exclude logistics companies** from main supplier list
   - Companies with SHIPPING, LOGISTICS, FREIGHT, EXPRESS, CONTAINER, LINE keywords
   - Shown in collapsed "Excluded" section with reason pills
   - No impact on logistics-category products (exception)

2. **🍬 Tightened food material fallback**
   - For food/candy/snack: Requires 2-token combos (e.g., "jelly candy" not just "jelly")
   - Reduces garbage recalls while maintaining precision
   - Other categories use standard single-token fallback (unchanged)

3. **🔧 Optional supplier enrichment**
   - Set `SUPPLIER_ENRICHMENT_ENABLED=false` to skip enrichment silently
   - Default: false (no noisy warnings)
   - Set to `true` if your supplier_enrichment table exists

### Files Changed

**Core Logic:**
- `src/lib/supplier-lead-helpers.ts` - NEW `isLogisticsOnly()` function
- `src/lib/intelligence-pipeline.ts` - Food material tightening + logging

**API:**
- `src/app/api/reports/[reportId]/route.ts` - Split into 3 match arrays
- `src/app/api/analyze/route.ts` - Optional enrichment via env flag

**UI:**
- `src/components/report-v2/ReportV2SourcingLeads.tsx` - Show excluded section with reasons

**Testing:**
- `src/lib/supplier-lead-helpers.test.ts` - NEW QA helpers and unit tests

### How to Use

#### 1. View Leads (No UI changes needed)
Default behavior: Shows recommended + candidates only, logistics excluded
```
Suggested suppliers: [non-excluded]
Unverified: [non-excluded candidates]
Excluded (2): [Show/Hide] ← Collapsed by default
```

#### 2. Configure (Optional)
```bash
# If you want to enable supplier enrichment:
export SUPPLIER_ENRICHMENT_ENABLED=true

# Otherwise, default is false (enrichment skipped)
```

#### 3. Debug/Test (Development)
```typescript
import { runLeadsQAChecks } from "@/lib/supplier-lead-helpers.test";

// Validate isLogisticsOnly() classification
runLeadsQAChecks();
// ✓ Test 1: Shipping company...
// ✓ Test 2: Logistics company...
// === Results: 9 passed, 0 failed ===

// Check specific supplier
import { debugLogisticsKeywords } from "@/lib/supplier-lead-helpers.test";
debugLogisticsKeywords("Global Shipping Solutions");
// { matched: ["SHIPPING"], isLogistics: true }
```

### What You'll See in Logs

```
[Pipeline Step 2] Final Supplier Matching Summary: {
  totalMatches: 12,
  exactMatches: 5,
  inferredMatches: 7,
  excludedCount: 2,              ← NEW
  logisticsExcludedCount: 2,     ← NEW
  ...
}

[Pipeline Step 2] Food category: Used tightened 2-token material fallback to reduce garbage recalls
```

### API Response Changes

**New fields in report:**
```json
{
  "_recommendedMatches": [...],     // Non-excluded, high quality
  "_candidateMatches": [...],       // Non-excluded, medium quality
  "_excludedMatches": [...],        // Logistics/low-quality (collapsed in UI)
  "_supplierRecommendedCount": 5,
  "_supplierCandidateCount": 3,
  "_supplierExcludedCount": 2
}
```

**Each match now includes:**
```json
{
  "isExcluded": false,
  "flags": {
    "excluded_reason": "logistics_only",  // NEW (if excluded)
    "evidence_strength": "strong",
    "why_lines": [...]
  }
}
```

### No Breaking Changes ✅

- `_supplierMatches` still returned (combined list)
- Old code expecting single array still works
- Backward compatible with existing UI/reports
- All data uses existing database columns

### Testing Checklist

- [ ] Logistics companies show in "Excluded" section
- [ ] Reason pills appear for excluded matches
- [ ] Food category uses tighter material search
- [ ] Enrichment skips silently when disabled
- [ ] No TypeScript errors
- [ ] QA checks pass: `runLeadsQAChecks()` → "9 passed"

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Logistics companies still in main list | Rebuild/restart, check that isExcluded flag is computed |
| Empty excluded section | Check logs for "logisticsExcludedCount: 0" |
| Enrichment warnings appearing | Set `SUPPLIER_ENRICHMENT_ENABLED=false` in .env |
| Food material search too narrow | Check that getFoodCategoryHeadNoun() returns valid noun |
| QA checks failing | Review test cases in `supplier-lead-helpers.test.ts` |

### Performance Impact

- ✅ No database schema changes
- ✅ No additional queries (exclusion computed from existing flags)
- ✅ Food material fallback uses fewer/tighter queries
- ✅ Enrichment skipped entirely when disabled (no table checks)
- **Overall:** Slight performance improvement when enrichment disabled

### Documentation Files

- [LEADS_QUALITY_IMPROVEMENTS.md](./LEADS_QUALITY_IMPROVEMENTS.md) - Detailed technical docs
- [ENV_VARIABLES.md](./ENV_VARIABLES.md) - Environment configuration reference
- This file - Quick start guide

---

**Status:** ✅ Production Ready  
**Last Updated:** December 29, 2025  
**No schema changes required** · **Backward compatible** · **Opt-in enrichment**
