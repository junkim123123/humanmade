// @ts-nocheck
// ============================================================================
// Text Matching - Whole Token Based
// ============================================================================
// Prevents partial matches like "line" matching "pipeline" or "outline"
// Only matches whole tokens at word boundaries

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const containsWholeToken = (haystackRaw: string, needleRaw: string) => {
  const haystack = (haystackRaw || "").toLowerCase();
  const needle = (needleRaw || "").toLowerCase().trim();
  if (!haystack || !needle) return false;

  // Check for multi-word phrases directly
  if (needle.includes(" ")) return haystack.includes(needle);

  // Single tokens require boundary checks
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`);
  return re.test(haystack);
};

export const countAnchorHitsStrict = (candidateText: string, anchors: string[]) => {
  let hits = 0;
  for (const a of anchors || []) {
    if (containsWholeToken(candidateText, a)) hits += 1;
  }
  return hits;
};

/**
 * Find which anchor terms matched in the haystack text
 * Returns up to 2 matched anchor strings (de-duplicated)
 * Uses the same whole-token matching logic as countAnchorHitsStrict for consistency
 */
export const findMatchedAnchors = (
  anchorTermsUsed: string[],
  haystackText: string
): string[] => {
  if (!anchorTermsUsed || anchorTermsUsed.length === 0 || !haystackText) {
    return [];
  }

  const matched: string[] = [];
  const seen = new Set<string>();

  for (const term of anchorTermsUsed) {
    if (!term) continue;
    
    // Use the same matching logic as countAnchorHitsStrict
    if (containsWholeToken(haystackText, term)) {
      // De-duplicate by normalized term
      const normalizedTerm = term.toLowerCase().trim();
      if (seen.has(normalizedTerm)) continue;
      
      matched.push(term); // Keep original term for display
      seen.add(normalizedTerm);
      
      if (matched.length >= 2) break; // Max 2 examples
    }
  }

  return matched;
};







