import { createClient } from "@/lib/supabase/server";
import type { SupplierMatch } from "@/types";
import { ProductSignals, ProductSignalEvidence } from "@/lib/report/signals";
import { getCategoryPriorities } from "@/lib/report/category-rules";
import { cookies } from "next/headers";

export interface SupplierMatchingParams {
  productName: string;
  category: string;
  keywords: string[];
  attributes: Record<string, string>;
}

export async function findSupplierMatches(
  params: SupplierMatchingParams
): Promise<SupplierMatch[]> {
  const supabase = createClient(cookies());

  // Search in Supabase cache first
  // This is a placeholder - implement actual search logic based on your schema
  const { data, error } = await supabase
    .from("supplier_products")
    .select("*")
    .ilike("product_name", `%${params.productName}%`)
    .limit(10);

  if (error) {
    console.error("Error fetching supplier matches:", error);
    return [];
  }

  // Transform and score matches
  const matches: SupplierMatch[] = (data || []).map((item) => ({
    supplierId: item.supplier_id,
    supplierName: item.supplier_name || "Unknown Supplier",
    productName: item.product_name,
    unitPrice: item.unit_price || 0,
    moq: item.moq || 1,
    leadTime: item.lead_time || 0,
    matchScore: calculateMatchScore(item, params),
    importKeyId: item.import_key_id || null,
  }));

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(
  item: Record<string, unknown>,
  params: SupplierMatchingParams
): number {
  let score = 0;

  // Name similarity (0-50 points)
  const nameSimilarity = calculateStringSimilarity(
    params.productName.toLowerCase(),
    (item.product_name as string)?.toLowerCase() || ""
  );
  score += nameSimilarity * 50;

  // Category match (0-30 points)
  if (item.category === params.category) {
    score += 30;
  }

  // Keyword matches (0-20 points)
  const keywordMatches = params.keywords.filter((keyword) =>
    (item.product_name as string)?.toLowerCase().includes(keyword.toLowerCase())
  );
  score += (keywordMatches.length / params.keywords.length) * 20;

  return Math.min(100, Math.round(score));
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple similarity calculation - you may want to use a more sophisticated algorithm
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// ============================================================================
// Fallback Supplier Matching - Uses ProductSignals when Step 1 fails
// ============================================================================

export interface SupplierMatchingFallbackParams {
  signals: ProductSignals;
  evidence: ProductSignalEvidence;
}

export interface SupplierMatchingFallbackResult {
  candidates: SupplierMatch[];
  reasonCode?: "no_signals" | "no_matches";
}

/**
 * Fallback supplier matching when Step 1 product analysis fails
 * Uses ProductSignals (deterministically built from uploads)
 */
export async function matchSuppliersFallback(
  params: SupplierMatchingFallbackParams
): Promise<SupplierMatchingFallbackResult> {
  const { signals, evidence } = params;

  // Check if we have minimal signals
  const hasUpc = !!signals.upc;
  const hasBrand = !!signals.brand;
  const hasModel = !!signals.model;
  const hasKeywords = signals.keywords && signals.keywords.length > 0;

  if (!hasUpc && !hasBrand && !hasModel && !hasKeywords) {
    console.warn("[Fallback Supplier Matching] No signals available for matching");
    return {
      candidates: [],
      reasonCode: "no_signals",
    };
  }

  try {
    const supabase = createClient(cookies());

    // Build search query
    const primaryTerms: string[] = [];
    if (signals.brand) primaryTerms.push(signals.brand);
    if (signals.model) primaryTerms.push(signals.model);
    if (signals.upc) primaryTerms.push(signals.upc);

    const keywordTerms = (signals.keywords || []).slice(0, 8); // Top 8 keywords

    const allSearchTerms = [...primaryTerms, ...keywordTerms];

    console.log("[Fallback Supplier Matching] Building search query", {
      categoryHint: signals.categoryHint,
      primaryTerms,
      keywordCount: keywordTerms.length,
      totalTerms: allSearchTerms.length,
    });

    // Search in supplier products table using keywords
    let query = supabase.from("supplier_products").select("*");

    // Build search condition: match any keyword
    if (allSearchTerms.length > 0) {
      const searchPattern = allSearchTerms.map((t) => `%${t}%`).join("|");
      query = query.or(`product_name.ilike.${searchPattern},supplier_name.ilike.${searchPattern}`);
    }

    // Filter by category if available
    if (signals.categoryHint) {
      query = query.ilike("category", `%${signals.categoryHint.replace("_", " ")}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error("[Fallback Supplier Matching] Search error:", error.message);
      return {
        candidates: [],
        reasonCode: "no_matches",
      };
    }

    if (!data || data.length === 0) {
      console.warn("[Fallback Supplier Matching] No matching suppliers found");
      return {
        candidates: [],
        reasonCode: "no_matches",
      };
    }

    // Transform results into SupplierMatch objects with fallback badges
    const categoryPriorities = getCategoryPriorities(signals.categoryHint);

    const candidates: SupplierMatch[] = data
      .map((item, index) => {
        const reasonBadges: string[] = [];

        // Add reason badges
        if (signals.categoryHint) {
          reasonBadges.push("Category match only");
        }
        if (!hasUpc && !hasBrand && !hasModel && hasKeywords) {
          reasonBadges.push("Signals limited");
        }
        if (hasUpc) {
          reasonBadges.push("Barcode present");
        }

        return {
          supplierId: item.supplier_id,
          supplierName: item.supplier_name || "Unknown Supplier",
          productName: item.product_name,
          unitPrice: item.unit_price || 0,
          moq: item.moq || 1,
          leadTime: item.lead_time || 0,
          matchScore: (10 - Math.min(index, 5)) * 10, // Decending score: 100, 90, 80, 70, 60, 50
          importKeyId: item.import_key_id || null,
          matchType: "fallback",
          confidence: "low",
          reasonBadges,
          evidence: {
            recordCount: 0,
            lastSeenDays: null,
            productTypes: signals.keywords || [],
            anchors: [],
            whyLines: [
              signals.categoryHint ? `Category: ${signals.categoryHint.replace(/_/g, " ")}` : "Limited signals match",
              `Signals: ${[hasUpc ? "UPC" : null, hasBrand ? "Brand" : null, hasModel ? "Model" : null, hasKeywords ? "Keywords" : null]
                .filter(Boolean)
                .join(", ")}`,
            ],
          },
        } as any;
      })
      .slice(0, 5); // Return top 5

    console.log("[Fallback Supplier Matching] Matched", candidates.length, "fallback candidates");
    return {
      candidates,
    };
  } catch (error) {
    console.error("[Fallback Supplier Matching] Unexpected error:", error);
    return {
      candidates: [],
      reasonCode: "no_matches",
    };
  }
}

