/**
 * Hydrate report data for V2 rendering
 * Merges report row with product_supplier_matches and ensures consistent structure
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeReport } from "./normalizeReport";
import type { NormalizedSupplierMatch } from "./normalizeReport";

export type HydrateResult =
  | { ok: true; report: any }
  | { ok: false; errorCode: "NOT_FOUND" | "FORBIDDEN" };

/**
 * Hydrate a report for V2 rendering
 * Fetches report from DB, enforces access control, and merges supplier matches
 */
export async function hydrateReportForV2(
  reportId: string,
  viewerUserId: string | null
): Promise<HydrateResult> {
  try {
    const admin = getSupabaseAdmin();

    // Fetch report row
    const { data: reportData, error: readError } = await admin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (readError || !reportData) {
      console.error("[HydrateReport] Report not found:", {
        reportId,
        error: readError?.message,
        code: readError?.code,
      });
      return { ok: false, errorCode: "NOT_FOUND" };
    }

    const reportAny = reportData as any;

    // Ensure report data structure exists
    if (!reportAny) {
      console.error("[HydrateReport] Report data is null or undefined:", reportId);
      return { ok: false, errorCode: "NOT_FOUND" };
    }

    // Ensure baseline exists (may be empty object initially)
    if (!reportAny.baseline || typeof reportAny.baseline !== "object") {
      console.warn("[HydrateReport] Baseline missing or invalid, initializing:", reportId);
      reportAny.baseline = reportAny.baseline || {};
    }

    // Ensure pipeline_result exists
    if (!reportAny.pipeline_result || typeof reportAny.pipeline_result !== "object") {
      console.warn("[HydrateReport] pipeline_result missing or invalid, initializing:", reportId);
      reportAny.pipeline_result = reportAny.pipeline_result || { scenarios: [] };
    }

    // Ensure data field exists
    if (!reportAny.data || typeof reportAny.data !== "object") {
      console.warn("[HydrateReport] data field missing or invalid, initializing:", reportId);
      reportAny.data = reportAny.data || {};
    }

    // Enforce access control
  // If report.user_id is null, allow anyone
  // If report.user_id exists, require viewerUserId and must match
  if (reportAny.user_id !== null && reportAny.user_id !== undefined) {
    if (!viewerUserId) {
      console.log("[HydrateReport] Report requires auth but viewer not logged in:", reportId);
      return { ok: false, errorCode: "FORBIDDEN" };
    }

    if (viewerUserId !== reportAny.user_id) {
      console.log("[HydrateReport] User mismatch:", {
        reportUserId: reportAny.user_id,
        viewerUserId,
        reportId,
      });
      return { ok: false, errorCode: "FORBIDDEN" };
    }
  }

  // Fetch supplier matches from product_supplier_matches table
  // Try multiple ID fields: report_id, product_id, analysis_id
  // (supplier matches may be stored with different ID types)
  let supplierMatchesData: any[] | null = null;
  let matchesError: any = null;
  
  // First try report_id (if matches are stored with report_id)
  let query = admin
    .from("product_supplier_matches")
    .select("*")
    .eq("report_id", reportId);
  
  const { data: reportIdMatches, error: reportIdError } = await query
    .order("rerank_score", { ascending: false, nullsFirst: false })
    .order("match_score", { ascending: false, nullsFirst: false });
  
  if (reportIdMatches && reportIdMatches.length > 0) {
    supplierMatchesData = reportIdMatches;
    console.log(`[HydrateReport] Found ${supplierMatchesData.length} matches by report_id`);
  } else {
    // Try product_id or analysis_id from report data
    const productId = reportAny.product_id;
    const analysisId = reportAny.analysis_id;
    
    if (productId) {
      const { data: productIdMatches, error: productIdError } = await admin
        .from("product_supplier_matches")
        .select("*")
        .eq("product_id", productId)
        .order("rerank_score", { ascending: false, nullsFirst: false })
        .order("match_score", { ascending: false, nullsFirst: false });
      
      if (productIdMatches && productIdMatches.length > 0) {
        supplierMatchesData = productIdMatches;
        console.log(`[HydrateReport] Found ${supplierMatchesData.length} matches by product_id: ${productId}`);
      } else if (productIdError) {
        matchesError = productIdError;
      }
    }
    
    if (!supplierMatchesData && analysisId) {
      const { data: analysisIdMatches, error: analysisIdError } = await admin
        .from("product_supplier_matches")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("rerank_score", { ascending: false, nullsFirst: false })
        .order("match_score", { ascending: false, nullsFirst: false });
      
      if (analysisIdMatches && analysisIdMatches.length > 0) {
        supplierMatchesData = analysisIdMatches;
        console.log(`[HydrateReport] Found ${supplierMatchesData.length} matches by analysis_id: ${analysisId}`);
      } else if (analysisIdError && !matchesError) {
        matchesError = analysisIdError;
      }
    }
    
    if (!supplierMatchesData && reportIdError) {
      matchesError = reportIdError;
    }
  }

  // If match table read fails, try to use snapshot from data._v2Snapshot
  let normalizedMatches: NormalizedSupplierMatch[] = [];
  if (matchesError || !supplierMatchesData || supplierMatchesData.length === 0) {
    if (matchesError) {
      console.warn("[HydrateReport] Failed to fetch supplier matches, trying snapshot:", matchesError.message);
    }
    
    // Try to use snapshot as fallback
    const snapshot = (reportAny.data as any)?._v2Snapshot;
    if (snapshot?._supplierMatches && Array.isArray(snapshot._supplierMatches)) {
      console.log("[HydrateReport] Using snapshot for supplier matches");
      // Snapshot matches are already normalized, just use them directly
      normalizedMatches = snapshot._supplierMatches.map((m: any, idx: number) => ({
        ...m,
        // Ensure all required fields exist
        id: m.id || m.supplierId || `snapshot-${idx}`,
        supplierId: m.supplierId || m.supplier_id || m.id || `snapshot-${idx}`,
        supplier_id: m.supplier_id || m.supplierId || m.id || `snapshot-${idx}`,
        supplierName: m.supplierName || m.supplier_name || "Unknown supplier",
        supplier_name: m.supplier_name || m.supplierName || "Unknown supplier",
        exact_match_count: m.exact_match_count ?? 0,
        inferred_match_count: m.inferred_match_count ?? 0,
        _intel: m._intel || { product_count: 0, price_coverage_pct: 0, last_seen_days: null },
        _profile: m._profile || { country: null, last_seen_date: null, shipment_count_12m: null, role: null, role_reason: null },
        _supplierType: m._supplierType || null,
        _companyType: m._companyType || null,
        _exampleProducts: m._exampleProducts || [],
      }));
    } else {
      normalizedMatches = [];
    }
  } else {
    // Normalize supplier matches from database format
    normalizedMatches = normalizeSupplierMatchesFromDB(supplierMatchesData);
  }

  // Split into recommended and candidate based on tier
  const recommended: NormalizedSupplierMatch[] = [];
  const candidate: NormalizedSupplierMatch[] = [];

  normalizedMatches.forEach((match) => {
    // Check tier from original data or infer from flags
    const tier = (match as any).tier || (match as any)._tier;
    if (tier === "recommended") {
      recommended.push(match);
    } else {
      candidate.push(match);
    }
  });

  // Attach to report object - always ensure arrays exist (empty if no matches)
  reportAny._recommendedMatches = recommended;
  reportAny._candidateMatches = candidate;
  reportAny._supplierMatches = [...recommended, ...candidate];

  // If HS candidates are missing, try to use snapshot
  if (!reportAny._hsCandidates || (Array.isArray(reportAny._hsCandidates) && reportAny._hsCandidates.length === 0)) {
    const snapshot = (reportAny.data as any)?._v2Snapshot;
    if (snapshot?._hsCandidates && Array.isArray(snapshot._hsCandidates) && snapshot._hsCandidates.length > 0) {
      console.log("[HydrateReport] Using snapshot for HS candidates");
      reportAny._hsCandidates = snapshot._hsCandidates;
    }
  }

  // Ensure decision summary exists (from data._decisionSummary)
  if (!reportAny._decisionSummary) {
    reportAny._decisionSummary = (reportAny.data as any)?._decisionSummary || null;
  }

  // Normalize the report (this will also normalize supplier matches and HS fields)
  let normalized;
  try {
    normalized = normalizeReport(reportAny);
  } catch (normalizeError) {
    console.error("[HydrateReport] Error in normalizeReport:", {
      reportId,
      error: normalizeError instanceof Error ? normalizeError.message : String(normalizeError),
      stack: normalizeError instanceof Error ? normalizeError.stack : undefined,
    });
    // Return a minimal normalized report to prevent complete failure
    normalized = {
      ...reportAny,
      _supplierMatches: [],
      _recommendedMatches: [],
      _candidateMatches: [],
      _hsCandidates: [],
      baseline: reportAny.baseline || {},
      pipeline_result: reportAny.pipeline_result || { scenarios: [] },
    };
  }

    // Ensure arrays are always present (even if empty)
    if (!Array.isArray(normalized._supplierMatches)) {
      normalized._supplierMatches = [];
    }
    if (!Array.isArray(normalized._recommendedMatches)) {
      normalized._recommendedMatches = [];
    }
    if (!Array.isArray(normalized._candidateMatches)) {
      normalized._candidateMatches = [];
    }
    if (!Array.isArray(normalized._hsCandidates)) {
      normalized._hsCandidates = [];
    }

    return { ok: true, report: normalized };
  } catch (error) {
    // Catch any unexpected errors during hydration
    console.error("[HydrateReport] Unexpected error:", {
      reportId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return NOT_FOUND to trigger 404 instead of 500
    return { ok: false, errorCode: "NOT_FOUND" };
  }
}

/**
 * Normalize supplier matches from product_supplier_matches table format
 * to the shape expected by getSupplierMatches and SupplierCandidatesTop
 */
function normalizeSupplierMatchesFromDB(
  dbMatches: any[]
): NormalizedSupplierMatch[] {
  return dbMatches.map((dbMatch, index) => {
    // Extract flags and evidence from JSONB columns
    const flags = (dbMatch.flags || {}) as Record<string, any>;
    const evidence = (dbMatch.evidence || {}) as Record<string, any>;

    // Build normalized match
    const match: NormalizedSupplierMatch = {
      id: dbMatch.supplier_id || `match-${index}`,
      supplierId: dbMatch.supplier_id || "",
      supplier_id: dbMatch.supplier_id || "",
      supplierName: dbMatch.supplier_name || "Unknown supplier",
      supplier_name: dbMatch.supplier_name || "Unknown supplier",
      exact_match_count: flags.isInferred === false ? 1 : 0,
      inferred_match_count: flags.isInferred === true ? 1 : 0,
      _intel: {
        product_count: evidence.recordCount || 0,
        price_coverage_pct: 0, // Not stored in DB, will be calculated if needed
        last_seen_days: evidence.lastSeenDays ?? null,
      },
      _profile: {
        country: null, // Can be enriched from supplier data if available
        last_seen_date: evidence.lastSeenDays
          ? new Date(Date.now() - (evidence.lastSeenDays * 24 * 60 * 60 * 1000)).toISOString().split("T")[0]
          : null,
        shipment_count_12m: evidence.recordCount || null,
        role: flags.supplierType || null,
        role_reason: flags.why_lines?.[0] || null,
      },
      _supplierType: flags.supplierType || null,
      _companyType: null, // Can be enriched if available
      _exampleProducts: [], // Can be enriched from supplier_products if needed
      // Preserve original fields
      tier: dbMatch.tier,
      match_score: dbMatch.match_score,
      rerank_score: dbMatch.rerank_score,
      unit_price: dbMatch.unit_price,
      currency: dbMatch.currency,
      flags,
      evidence,
    };

    return match;
  });
}

