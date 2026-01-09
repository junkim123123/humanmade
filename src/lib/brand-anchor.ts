// @ts-nocheck
// ============================================================================
// Brand Anchor Extraction - Strict Mode
// ============================================================================
// Prevents ambiguous single tokens (like "line") from matching industrial terms
// Only multi-word phrases and safe single tokens are used as anchors
// Noise tokens (character/franchise names, marketing fluff) are automatically removed

import { removeNoiseTokens } from "./noise-tokens";

export const AMBIGUOUS_SINGLE_TOKENS = new Set([
  "line",
  "set",
  "cover",
  "pipe",
  "pipes",
  "conduit",
  "emt",
  "steel",
  "aluminum",
  "soffit",
  "vented",
  "seat",
  "valve",
  "mixer",
  "oven",
  "flour",
  "bakery",
  "machine",
  "machinery",
  "equipment",
  "global",
  "international",
  "limited",
  "co",
  "ltd",
]);

export const ANCHOR_STOPWORDS = new Set([
  "and",
  "&",
  "with",
  "for",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "to",
  "from",
  "assorted",
  "set",
  "display",
  "collection",
  "collectible",
  "mini",
  "small",
  "large",
  "kids",
  "kid",
  "children",
  "child",
]);

const normalize = (s: string) => (s || "").toLowerCase().trim();

const isHangul = (ch: string) => {
  const code = ch.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
};

export const tokenizeLoose = (s: string): string[] => {
  const t = normalize(s);
  if (!t) return [];
  const out: string[] = [];
  let cur = "";
  for (const ch of t) {
    const isAlphaNum =
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9") ||
      isHangul(ch);

    if (isAlphaNum) cur += ch;
    else {
      if (cur) out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
};

const keepSingleToken = (tok: string) => {
  const t = normalize(tok);
  if (!t) return false;
  if (ANCHOR_STOPWORDS.has(t)) return false;
  if (AMBIGUOUS_SINGLE_TOKENS.has(t)) return false;
  // Very short single tokens are often noise
  // Require at least 2 chars for CJK/Hangul, 5 chars for Latin
  const hasHangul = [...t].some(isHangul);
  if (hasHangul) return t.length >= 2;
  return t.length >= 5;
};

const keepPhrase = (phrase: string) => {
  const p = normalize(phrase);
  if (!p) return false;
  const parts = p.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  // Discard if the phrase only contains one meaningful token and the rest are stopwords
  const meaningful = parts.filter((w) => !ANCHOR_STOPWORDS.has(w));
  if (meaningful.length < 2) return false;
  // Discard if the entire phrase consists of ambiguous tokens
  const allAmbiguous = meaningful.every((w) => AMBIGUOUS_SINGLE_TOKENS.has(w));
  if (allAmbiguous) return false;
  return true;
};

const uniq = (arr: string[]) => Array.from(new Set(arr.map(normalize).filter(Boolean)));

export const extractBrandPhrasesStrict = (productName: string, keywords: string[]) => {
  const phrases: string[] = [];

  // Include keywords with 2 or more words as brand candidates
  for (const k of keywords || []) {
    const p = normalize(k);
    if (p.split(/\s+/).length >= 2) phrases.push(p);
  }

  // Generate bigram/trigram candidates from sequential tokens in productName
  const toks = tokenizeLoose(productName).filter((t) => !ANCHOR_STOPWORDS.has(t));
  for (let i = 0; i < toks.length - 1; i++) {
    phrases.push(`${toks[i]} ${toks[i + 1]}`);
    if (i < toks.length - 2) phrases.push(`${toks[i]} ${toks[i + 1]} ${toks[i + 2]}`);
  }

  const cleaned = uniq(phrases).filter(keepPhrase);

  // Safety mechanism:
  // If there is a definitive brand phrase like "line friends", the single token "line" 
  // will never be used as an anchor.
  return cleaned;
};

export const buildAnchorTermsStrict = (
  productName: string,
  keywords: string[],
  brandPhrases: string[]
) => {
  // Step 1: Remove noise tokens (character/franchise names, marketing fluff)
  // This prevents "Pokemon fan" or "Doraemon mini fan" from matching on useless tokens
  const noiseRemoval = removeNoiseTokens(
    [productName, ...(keywords || [])].join(" "),
    undefined // Category filtering is optional here
  );
  
  const cleanedProductName = productName;
  const cleanedKeywords = keywords || [];
  
  // Log noise removal for debugging (helpful for tuning)
  if (noiseRemoval.removedTokens.length > 0) {
    console.log(
      `[Anchor Terms] Removed noise tokens: ${noiseRemoval.removedTokens.join(", ")}`
    );
  }

  const anchors: string[] = [];

  // 1. Phrases have highest priority
  for (const p of brandPhrases || []) {
    if (keepPhrase(p)) anchors.push(normalize(p));
  }

  // 2. Keyword single tokens are strictly allowed
  // Use cleaned keywords (noise tokens already filtered by removeNoiseTokens)
  for (const k of cleanedKeywords) {
    for (const tok of tokenizeLoose(k)) {
      if (keepSingleToken(tok)) anchors.push(normalize(tok));
    }
  }

  // 3. productName single tokens are even more strict
  for (const tok of tokenizeLoose(cleanedProductName)) {
    if (keepSingleToken(tok)) anchors.push(normalize(tok));
  }

  const out = uniq(anchors);

  // Relax constraints if it's too strict and results in empty set
  if (out.length === 0) {
    const relaxed = uniq([
      ...tokenizeLoose(cleanedProductName).filter(
        (t) => t.length >= 4 && !AMBIGUOUS_SINGLE_TOKENS.has(t)
      ),
      ...(cleanedKeywords || [])
        .flatMap(tokenizeLoose)
        .filter((t) => t.length >= 4 && !AMBIGUOUS_SINGLE_TOKENS.has(t)),
    ]);
    
    // Even in relaxed mode, remove noise tokens from relaxed set
    const relaxedFiltered = relaxed.filter(
      (t) => !removeNoiseTokens(t).hadNoiseRemoval
    );
    
    return relaxedFiltered.length > 0 
      ? relaxedFiltered.slice(0, 12)
      : relaxed.slice(0, 12);
  }

  return out.slice(0, 16);
};














