# NexSupply Gating Removal - Quick Reference

## What Changed

### ❌ Removed
1. **"Not ready, needs details" yellow card** (DecisionCard)
2. **Missing inputs panel** (collapsible yellow warning)
3. **"Missing Unit weight" chips**
4. **"Missing Units per case" chips**
5. **Any blocking gating** - cost now always computes

### ✅ Added
1. **AssumptionsCard** - Shows current weight + case pack with Draft badges
2. **EditAssumptionsModal** - Lightweight form to update assumptions
3. **Update assumptions API** - Endpoint to confirm values
4. **Gemini defaults** - Weight & case pack automatically inferred

### 📊 Changed
1. **NextStepsCard** - Always shows suppliers (never empty)
2. **Landed cost** - Always computes (uses defaults if needed)
3. **Supplier display** - Non-logistics vs Logistics sections

## Key Features

### Assumptions Card (Row 1, Column 1)
```
┌─────────────────────────────┐
│  Assumptions used    [Edit]  │
├─────────────────────────────┤
│ Unit weight: 500g [Draft] 85%│ ← Hover for evidence
│ Units per case: 12 [Draft] 40%
└─────────────────────────────┘
```

### Edit Flow
1. Click "Edit assumptions" button
2. Modal appears with current values
3. User edits weight and case pack
4. Click "Save changes"
5. Cost recalculates, page refreshes
6. Draft badges removed (user confirmed)

### Supplier Section (Always Shows)

**Scenario 1: Has good suppliers**
```
Supplier candidates
├─ Company A (Manufacturer) [Evidence]
├─ Company B (Trading) [Evidence]
└─ Company C (Importer) [Evidence]
```

**Scenario 2: Only logistics**
```
Other entities
⚠️ "These handle shipping but are not supplier manufacturers"
```

**Scenario 3: No matches**
```
No leads yet
RFQ email draft [button]
Start verification with NexSupply [button]
Open search query [button]
```

## API Changes

### New Endpoint
```
POST /api/reports/[reportId]/update-assumptions
Body: { unitWeight: 500, unitsPerCase: 12 }
Returns: { costImprovement, newCostRange }
```

### Analyze Route
- Auto-runs Gemini inference for weight + case pack
- Falls back to category defaults if inference fails
- Always persists assumptions to database
- Cost computation never blocks

## Default Values (by Category)
| Category | Weight | Case Pack | Confidence |
|----------|--------|-----------|------------|
| Candy/Chocolate | 25g | [12, 24] | 0.25 |
| Beverage/Drink | 250ml | [12, 24] | 0.25 |
| Snack | 30g | [12, 24] | 0.25 |
| Supplement | 5g | [12, 24] | 0.25 |
| Other | 25g | [12, 24] | 0.25 |

## Files to Know

### New Components
- `AssumptionsCard.tsx` - Shows assumptions with Draft badges
- `EditAssumptionsModal.tsx` - Form to edit and confirm
- `update-assumptions` route - API endpoint

### Updated Components
- `OverviewModern.tsx` - Grid layout (AssumptionsCard instead of DecisionCard)
- `NextStepsCard.tsx` - Always shows suppliers (never empty)
- `ProfitCheckCard.tsx` - Removes blocking callback
- `analyze` route - Adds Gemini defaults

### Removed Components
- `DecisionCard.tsx` - No longer used
- `MissingInputsPanel.tsx` - No longer used

## Testing Quick Checks

### ✅ Does gating still exist?
Open a report → look for yellow "Not ready needs details" card
**Expected:** NONE (completely removed)

### ✅ Does cost always show?
Open any report → check Landed Cost Card
**Expected:** Always renders with values

### ✅ Do suppliers always show?
Open report with 0 matches → check Next Steps
**Expected:** Shows "No leads yet" with action buttons (never empty)

### ✅ Can user edit assumptions?
Click "Edit assumptions" in AssumptionsCard
**Expected:** Modal opens with current values

### ✅ Do defaults appear?
Create new report with minimal data
**Expected:** AssumptionsCard shows Draft values with low confidence (0.25-0.4)

## Migration Checklist

- [x] Remove DecisionCard from OverviewModern
- [x] Add AssumptionsCard to OverviewModern
- [x] Create EditAssumptionsModal component
- [x] Create update-assumptions API endpoint
- [x] Add Gemini defaults to analyze route
- [x] Update NextStepsCard for always-show suppliers
- [x] Update ProfitCheckCard (remove blocking)
- [x] Build passes (0 TypeScript errors)
- [x] No database migrations needed
- [x] Backward compatible with old reports

## Deployment

```bash
npm run build  # ✅ Passes
npm run dev    # Ready to test locally
```

**Non-breaking:** Can be deployed immediately, no feature flags needed.

## Rollback

If needed, revert these files:
- `OverviewModern.tsx` (restore DecisionCard)
- `NextStepsCard.tsx` (restore old logic)
- `analyze` route (remove Gemini defaults)

API endpoints and modals can remain (inactive if DecisionCard not used).

---

**Summary:** Gating removed, assumptions shown transparently with Draft badges, supplier section always visible, cost always computes. Users never see blocking messages. Everything marked as Draft until manually confirmed.
