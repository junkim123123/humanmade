/**
 * Normalize supplier matches from various report formats
 * Ensures UI always has a consistent supplier candidates array
 */

export interface NormalizedSupplierMatch {
  id: string;
  supplierName: string;
  supplierId: string;
  supplier_id: string;
  supplier_name: string;
  exact_match_count: number;
  inferred_match_count: number;
  _intel: {
    product_count: number;
    price_coverage_pct: number;
    last_seen_days: number | null;
  };
  _profile: {
    country: string | null;
    last_seen_date: string | null;
    shipment_count_12m: number | null;
    role: string | null;
    role_reason: string | null;
  };
  _supplierType: string | null;
  _companyType: string | null;
  _exampleProducts: Array<{
    product_name: string;
    category?: string;
    unit_price?: number;
  }>;
  // Preserve all other fields from original match
  [key: string]: any;
}

/**
 * Get supplier matches from report, normalizing from various sources
 * Priority:
 * 1. report._supplierMatches (if non-empty array)
 * 2. report._recommendedMatches + report._candidateMatches combined
 * 3. report.supplierMatches or report.supplier_matches (legacy)
 */
export function getSupplierMatches(report: any): NormalizedSupplierMatch[] {
  // Priority 1: Use _supplierMatches if it's a non-empty array
  if (Array.isArray(report._supplierMatches) && report._supplierMatches.length > 0) {
    return report._supplierMatches.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // Priority 2: Combine _recommendedMatches and _candidateMatches
  const recommended = Array.isArray(report._recommendedMatches) ? report._recommendedMatches : [];
  const candidates = Array.isArray(report._candidateMatches) ? report._candidateMatches : [];
  
  if (recommended.length > 0 || candidates.length > 0) {
    const combined = [...recommended, ...candidates];
    return combined.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // Priority 3: Fallback to legacy fields
  const legacyMatches = report.supplierMatches || report.supplier_matches;
  if (Array.isArray(legacyMatches) && legacyMatches.length > 0) {
    return legacyMatches.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // No matches found
  return [];
}

/**
 * Normalize a single supplier match to guarantee required keys exist
 */
function normalizeMatch(match: any, index: number): NormalizedSupplierMatch {
  // Extract id with safe fallbacks
  // prefer match.id, else match.supplier_id, else match.supplierId, else build `sample-${index}`
  const id = match.id || match.supplier_id || match.supplierId || `sample-${index}`;
  
  // Extract supplierName with safe fallbacks
  // prefer match.supplier_name, else match.supplierName, else match.supplier?.name, else "Unknown supplier"
  const supplierName = match.supplier_name || match.supplierName || match.supplier?.name || match.companyName || "Unknown supplier";
  
  // Extract supplierId with safe fallbacks
  // prefer match.supplier_id, else match.supplierId, else match.id
  const supplierId = match.supplier_id || match.supplierId || match.id || id;
  
  // Also set normalized snake_case versions for consistency
  const supplier_id = supplierId;
  const supplier_name = supplierName;

  // Extract match counts
  const exact_match_count = match.exact_match_count || match.exactMatchCount || 0;
  const inferred_match_count = match.inferred_match_count || match.inferredMatchCount || 0;

  // Normalize _intel
  const _intel = {
    product_count: match._intel?.product_count || match._intel?.productCount || 0,
    price_coverage_pct: match._intel?.price_coverage_pct || match._intel?.priceCoveragePct || 0,
    last_seen_days: match._intel?.last_seen_days ?? match._intel?.lastSeenDays ?? null,
  };

  // Normalize _profile
  const _profile = {
    country: match._profile?.country || match.country || null,
    last_seen_date: match._profile?.last_seen_date || match._profile?.lastSeenDate || match.last_seen_date || null,
    shipment_count_12m: match._profile?.shipment_count_12m || match._profile?.shipmentCount12m || match.shipment_count_12m || null,
    role: match._profile?.role || match.role || match.supplierRole || null,
    role_reason: match._profile?.role_reason || match._profile?.roleReason || match.role_reason || null,
  };

  // Normalize supplier/company types
  const _supplierType = match._supplierType || match.supplierType || match.supplierRole || null;
  const _companyType = match._companyType || match.companyType || null;

  // Normalize example products (max 2)
  let _exampleProducts: Array<{ product_name: string; category?: string; unit_price?: number }> = [];
  if (Array.isArray(match._exampleProducts)) {
    _exampleProducts = match._exampleProducts.slice(0, 2).map((p: any) => ({
      product_name: p.product_name || p.productName || "",
      category: p.category,
      unit_price: p.unit_price || p.unitPrice,
    }));
  }

  // Return normalized match with all original fields preserved
  return {
    ...match,
    id,
    supplierName,
    supplierId,
    supplier_id,
    supplier_name,
    exact_match_count,
    inferred_match_count,
    _intel,
    _profile,
    _supplierType,
    _companyType,
    _exampleProducts,
  };
}

