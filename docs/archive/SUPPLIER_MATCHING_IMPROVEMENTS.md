# Supplier Matching Improvements - Task 8 Complete

## Overview
Implemented comprehensive supplier matching improvements to increase coverage and recall by removing noisy tokens (character/franchise names, marketing fluff) and strengthening fallback search with multi-round strategies.

## Changes Made

### 1. Noise Token Removal Utility (`src/lib/noise-tokens.ts`) ✅
**Purpose**: Identify and remove character names, franchise tokens, and marketing fluff that harm supplier search recall.

**Key Features**:
- **Character Tokens**: Disney, Pokemon, Doraemon, Hello Kitty, Sanrio, anime characters, etc.
- **Marketing Fluff**: "official", "authentic", "cute", "kawaii", "gift", "replica", etc.
- **Brand Modifiers**: "brand new", "unopened", "licensed", etc.
- **Category-Specific Noise**: Context-aware removal (e.g., "toy" is noise in toy category but not in general products)

**Functions**:
- `removeNoiseTokens(query, category?)` - Filters out noise while preserving at least one functional token
- `isNoiseToken(token)` - Check if single token is noise
- `containsCharacterToken(query)` - Detect character/franchise presence
- `addNoiseTokens(tokens, category?)` - Runtime extension for tuning

**Safety**: Preserves at least one token to avoid empty searches. Example: "Pokemon fan" → ["fan"] (not empty)

### 2. Integrated Noise Removal into Anchor Terms (`src/lib/brand-anchor.ts`) ✅
**Changes**:
- Added `removeNoiseTokens` import
- Updated `buildAnchorTermsStrict()` to filter noise tokens from keywords and product names
- Logs removed tokens for debugging

**Impact**: Prevents character/franchise names from becoming anchor search terms, improving matching precision.

### 3. Integrated Noise Removal into Primary Search (`src/lib/intelligence-pipeline.ts`) ✅
**Changes**:
- Added `removeNoiseTokens` import
- Updated `buildSearchTerms()` to clean search tokens before database queries
- Logs removed tokens for each search round
- Tracks `hasRemovedNoiseTokens` flag for final summary

**Search Flow**:
1. Extract tokens from product name, keywords, category, material
2. Apply noise token removal
3. Search database with cleaned tokens
4. Multi-round fallback if < 3 exact matches found

### 4. Two-Tier Supplier Name Filtering (`src/lib/intelligence-pipeline.ts`) ✅
**Architecture**:

| Tier | Action | Filter | Example |
|------|--------|--------|---------|
| **Hard Reject** | Remove completely | `shouldRemoveName()` | Empty, only symbols, only "IMPORT EXPORT", placeholder words |
| **Soft Demote** | Keep as candidate | `isLowQualityName()` + `isLikelyLogistics()` | Short names, high symbol ratio, logistics companies |

**Implementation**:
- `shouldRemoveName()` - Strict removal (existing, unchanged)
- `isLowQualityName()` - Detect suspicious but salvageable names
- `isLikelyLogistics()` - Identify freight forwarders (demote, don't remove)
- Fallback search tracks both hard rejects and soft demotes separately

**Benefits**:
- Reduces false-positive removals
- Maintains data availability for fallback rounds
- Tracks statistics for tuning

### 5. Enhanced Telemetry & Logging (`src/lib/intelligence-pipeline.ts`) ✅
**Tracking Objects**:

**Exact Match Phase**:
```
removalReasons: {
  tooShort, various, assorted, mixed, random,
  banned, badName, logistics, toyMismatch, foodMismatch
}
```

**Fallback Phase**:
```
fallbackStats: {
  anchorRound: { searched, filtered, added },
  hs6Round: { searched, filtered, added },
  categoryRound: { searched, filtered, added },
  materialRound: { searched, filtered, added },
  hardRejects: { banned, shouldRemoveName, toyMismatch, foodMismatch },
  softDemotes: { logistics, lowQuality }
}
```

**Final Summary**:
```
matchingSummary: {
  totalMatches, exactMatches, inferredMatches,
  topScore, topRerankScore,
  recommendedCount, candidateCount
}
```

**Logs**: Comprehensive console logs at each step for debugging matching quality.

### 6. Multi-Round Fallback Search (Already Implemented) ✅
**Existing Strategy** (verified and enhanced):
1. **Anchor Keywords**: Top 6 functional tokens from product name/keywords
2. **HS6 Fallback**: When anchor < 5 results, search by HS Code prefix
3. **Category Fallback**: When < 5 results, search by product category
4. **Material Fallback**: When < 5 results, search by material tokens (stopwords filtered)

**Threshold**: Each round checks `inferredProducts.size < 5` to trigger next round.

**Enhancement**: Added noise token removal to anchor keywords phase, strengthening recall.

## Test Cases

### Case 1: Character-Branded Product (Pokemon Fan)
**Input**: "Portable Pokemon mini fan 12V"
**Before**: Search tokens = ["pokemon", "portable", "mini", "fan"] → Weak recall (character noise)
**After**: 
- Noise removal: ["pokemon"] removed (character token)
- Search tokens = ["portable", "mini", "fan"]
- Better recall with functional terms only
**Log**: `[Pipeline Step 2] Removed noise tokens from search: pokemon`

### Case 2: Marketing-Heavy Product (Official Authentic Doraemon)
**Input**: "Official authentic Doraemon cute gift replica 10cm"
**Before**: Many noise terms dilute signal
**After**:
- Removed: ["official", "authentic", "doraemon", "cute", "gift", "replica"]
- Kept: ["10cm"] - if min length allows, else no match (handled gracefully)
**Log**: Logs all 6 removed tokens for tuning

### Case 3: Low-Quality Supplier Name
**Supplier**: "^*@&^%" or just punctuation
**Behavior**: 
- Hard reject in initial search (shouldRemoveName = true)
- Not added to fallback candidates
- Logged under removalReasons.badName

### Case 4: Logistics Company (Soft Demote)
**Supplier**: "Global Freight Forwarding Ltd"
**Behavior**:
- Initial search: Filtered out (isLikelyLogistics = true)
- Fallback: Added but marked `isInferred = true` (becomes candidate)
- Score penalized by 20 points
- Logged under softDemotes.logistics

## Console Log Examples

### Noise Token Removal
```
[Pipeline Step 2] Removed noise tokens from search: pokemon, doraemon, official
[Anchor Terms] Removed noise tokens: cute, kawaii, cartoon
```

### Fallback Statistics
```
[Pipeline Step 2 Fallback] Statistics: {
  rounds: {
    anchor: { searched: 50, filtered: 12, added: 38 },
    hs6: { searched: 0, filtered: 0, added: 0 },
    category: { searched: 30, filtered: 5, added: 25 },
    material: { searched: 0, filtered: 0, added: 0 }
  },
  filtering: {
    hardRejects: { banned: 0, shouldRemoveName: 1, toyMismatch: 2, foodMismatch: 0 },
    softDemotes: { logistics: 3, lowQuality: 1 }
  }
}
```

### Final Summary
```
[Pipeline Step 2] Final Supplier Matching Summary: {
  totalMatches: 8,
  exactMatches: 3,
  inferredMatches: 5,
  topScore: 45,
  topRerankScore: 52,
  recommendedCount: 2,
  candidateCount: 6
}
[Pipeline Step 2] Noise tokens were removed during search. This may have improved recall for character-branded products.
```

## Benefits

1. **Improved Recall**: Character/franchise tokens no longer dilute search, finding more relevant suppliers
2. **Better Coverage**: Multi-round fallback ensures >= N suppliers found (vs 0 matches)
3. **Less Over-Filtering**: Two-tier approach keeps low-quality names as candidates instead of removing
4. **Debugging**: Comprehensive logs show exactly why candidates were removed/demoted
5. **Tuning**: Can add/remove noise tokens via `addNoiseTokens()` at runtime

## Files Modified

1. **New File**: `src/lib/noise-tokens.ts` (175 lines)
   - Noise token definitions and removal logic

2. **Modified**: `src/lib/brand-anchor.ts`
   - Import noise-tokens
   - Update buildAnchorTermsStrict() with noise filtering

3. **Modified**: `src/lib/intelligence-pipeline.ts`
   - Import removeNoiseTokens
   - Add hasRemovedNoiseTokens flag tracking
   - Update buildSearchTerms() with noise removal
   - Enhanced fallbackStats tracking
   - Added fallback statistics logging
   - Added final matchingSummary
   - Added soft-demote tracking in addInferredProduct()

## No Breaking Changes
- All changes are additive (new functions, improved filtering)
- Existing supplier matches still work
- Backward compatible with current cache and UI
- No database schema changes required

## Next Steps for Tuning

1. **Monitor Logs**: Watch console output for `removedNoiseTokens` across different products
2. **Adjust Noise Lists**: If certain tokens consistently harm recall, remove from MARKETING_FLUFF or add to CHARACTER_TOKENS
3. **Category-Specific Tuning**: Use `addNoiseTokens()` to extend category-specific noise in real-time
4. **Fallback Thresholds**: Can adjust `inferredProducts.size < 5` thresholds per category if needed
5. **Score Penalties**: Soft-demote penalties (20 for logistics, 5 for low-quality) can be tuned based on results

## Verification

✅ No TypeScript errors
✅ All imports resolved
✅ Noise token utilities exported correctly
✅ Fallback tracking variables scoped correctly
✅ Logging statements placed at appropriate levels
✅ Backward compatible with existing matching flow
