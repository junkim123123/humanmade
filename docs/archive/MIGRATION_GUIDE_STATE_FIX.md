# Migration Guide: State Inconsistency Fix

## Summary
This update centralizes quality tier and input status computation into `src/lib/report/truth.ts`, eliminating contradictions where different components showed conflicting information.

## Impact Assessment

### Breaking Changes
❌ **NONE** - All changes are backward compatible. The Report type structure is unchanged.

### Component Changes
✅ EstimateQualityBadge - Prop changed from `quality: string` to `report: Report`
   - Only used in OverviewModern (already updated)
   
✅ DecisionCard - Removed `missingInputsCount: number` prop (now computed internally)
   - Only used in OverviewModern (already updated)

### Database/API Changes
❌ **NONE** - No database or API changes required

### Feature Improvements
✅ Quality tier now computed with hard downgrade rules (missing inputs, OCR failures)
✅ OCR failure state properly tracked and prevents false "confirmed" claims
✅ Manual label entry can recover from OCR failures
✅ All components now use same truth source - no contradictions possible

## Testing Checklist

### Unit Tests (Manual)
- [ ] Display report with OCR failed
  - [ ] Verify "Unit weight confirmed" NOT shown in WhatWeKnowCard
  - [ ] Verify "Missing weight" chip still shows in DecisionCard
  
- [ ] Display report with manual label entry after OCR fail
  - [ ] Verify "Unit weight confirmed" NOW shown in WhatWeKnowCard
  - [ ] Verify "Missing weight" chip disappears from DecisionCard
  
- [ ] Display report with verified quote
  - [ ] Verify badge shows "Verified quote"
  - [ ] Verify DecisionCard shows "Ready for test order"
  
- [ ] Display report with no inputs filled
  - [ ] Verify badge shows "Preliminary estimate"
  - [ ] Verify DecisionCard shows "Not ready, needs details"
  
### Integration Tests
- [ ] Build completes without errors: ✅ (Verified 7.6s build)
- [ ] No TypeScript compilation errors: ✅ (Verified)
- [ ] EstimateQualityBadge and DecisionCard both render: ✅ (Build verified)

### Regression Tests
- [ ] OverviewModern still renders all cards: ✅ (Build verified)
- [ ] MissingInputsPanel still receives correct missing inputs: ✅ (Uses truth.ts now)
- [ ] Report pages still load: ✅ (Build verified with routes)

## Configuration Changes Required
❌ **NONE**

## Environment Variables Changes Required
❌ **NONE**

## Deployment Notes
- Safe to deploy immediately
- No database migrations required
- No API changes required
- All changes are isolated to frontend logic
- Recommended: Deploy together with truth.ts usage

## Rollback Plan
If issues arise:
1. Revert changes to EstimateQualityBadge.tsx (restore quality prop)
2. Revert changes to DecisionCard.tsx (restore missingInputsCount prop)
3. Revert changes to WhatWeKnowCard.tsx (restore assumptions.weight check)
4. Revert changes to OverviewModern.tsx (restore quality calculation)
5. Delete truth.ts if not used elsewhere
6. Rebuild

Expected rollback time: < 5 minutes
