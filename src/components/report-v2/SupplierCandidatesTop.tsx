"use client";

import { useState } from "react";
import { Building2, MapPin, ChevronDown } from "lucide-react";
import { safePercent } from "@/lib/format/percent";

interface SupplierMatch {
  // Normalized fields (guaranteed by normalizeReport)
  id: string;
  supplierName: string;
  supplierId: string;
  supplier_id?: string;
  supplier_name?: string;
  // Optional metadata fields - do not filter out if missing
  supplierRole?: string;
  supplierKind?: string;
  entityType?: string;
  tier?: string;
  location?: string;
  country?: string;
  confidence?: "high" | "medium" | "low";
  matchMode?: "normal" | "fallback";
  evidenceLabel?: "customs_matched" | "customs_company_only" | "db_keyword_only" | "signals_limited";
  reasonBadges?: string[];
  matchScore?: number;
  // Legacy fields for backward compatibility
  companyName?: string;
  isManufacturer?: boolean;
  hasCustomsRecord?: boolean;
  categoryMatch?: boolean;
  matchType?: "normal" | "fallback";
  // Normalized fields
  _intel?: {
    product_count?: number;
    price_coverage_pct?: number;
    last_seen_days?: number | null;
  };
  _profile?: {
    country?: string | null;
    role?: string | null;
  };
}

interface SupplierCandidatesTopProps {
  matches: SupplierMatch[];
}

export default function SupplierCandidatesTop({ matches }: SupplierCandidatesTopProps) {
  const [showAll, setShowAll] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);

  if (!matches || matches.length === 0) {
    // Show empty state message so the section exists
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-[16px] font-semibold text-slate-900">Candidate factories</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-slate-600">No supplier candidates available for this product.</p>
        </div>
      </div>
    );
  }

  // Use normalized matches directly - normalization helper guarantees id and supplierName exist
  // Do NOT filter out matches - be tolerant of missing metadata
  const validMatches = matches;

  const isLogistics = (match: SupplierMatch): boolean => {
    const rawRole =
      match.supplierRole ??
      match.supplierKind ??
      match.entityType ??
      match.tier ??
      "";

    const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "";

    const flag = (match as any).type_logistics === true;
    return (
      flag ||
      role.includes("logistics") ||
      role.includes("freight") ||
      role.includes("forwarder") ||
      role.includes("trader") ||
      role.includes("broker")
    );
  };

  const filtered = showLogistics ? validMatches : validMatches.filter((m) => !isLogistics(m));
  const displayMatches = filtered.length > 0 ? filtered : validMatches;

  const showingFallback = !showLogistics && filtered.length === 0 && validMatches.length > 0;

  const topMatch = displayMatches[0];
  const remainingMatches = displayMatches.slice(1);
  const visibleRemaining = showAll ? remainingMatches : remainingMatches.slice(0, 2);
  const hiddenCount = Math.max(0, remainingMatches.length - visibleRemaining.length);

  // Safely extract intel fields for topMatch with nullish coalescing
  const productCount = topMatch._intel?.product_count ?? 0;
  const coveragePct = topMatch._intel?.price_coverage_pct ?? 0;
  const showIntel = productCount > 0 || coveragePct > 0;

  const normalizeBadgeLabel = (label: string) => {
    if (label.toLowerCase().startsWith("keyword match")) return "Keyword match";
    if (label.toLowerCase().startsWith("category aligned")) return "Category match";
    if (label.toLowerCase().includes("internal dataset")) return "Limited history in our dataset";
    return label;
  };

  const getReasonBadges = (match: SupplierMatch) => {
    const badges = [];

    // Use explicit reasonBadges from API if provided
    if (match.reasonBadges && match.reasonBadges.length > 0) {
      const color = match.matchMode === "fallback" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700";
      return match.reasonBadges.slice(0, 3).map((label) => ({
        label: normalizeBadgeLabel(label),
        color,
      }));
    }

    // Build badges from evidenceLabel (new normalized format)
    if (match.evidenceLabel === "customs_matched") {
      badges.push({ label: "Customs matched", color: "bg-emerald-100 text-emerald-700" });
    } else if (match.evidenceLabel === "customs_company_only") {
      badges.push({ label: "Customs company only", color: "bg-blue-100 text-blue-700" });
    } else if (match.evidenceLabel === "signals_limited") {
      badges.push({ label: "Signals limited", color: "bg-amber-100 text-amber-700" });
    } else {
      badges.push({ label: "Keyword match", color: "bg-slate-100 text-slate-700" });
    }

    // Add confidence badge
    if (match.confidence) {
      const confidenceColor = 
        match.confidence === "high" ? "bg-emerald-100 text-emerald-700" :
        match.confidence === "medium" ? "bg-blue-100 text-blue-700" :
        "bg-slate-100 text-slate-700";
      badges.push({ label: `${match.confidence} confidence`, color: confidenceColor });
    }

    return badges.slice(0, 3);
  };

  const getSupplierRoleDisplay = (match: SupplierMatch): string | null => {
    // Try multiple sources for role, including normalized _profile
    const rawRole =
      match.supplierRole ||
      match._profile?.role ||
      match.supplierKind ||
      match.entityType ||
      match.tier;

    // If no role found, return null (don't show "Type not provided" - just don't show anything)
    if (!rawRole || typeof rawRole !== "string") return null;

    const normalized = rawRole.trim();
    if (!normalized || normalized.toLowerCase() === "unknown") {
      return null; // Don't show "Type not provided" - just hide the field
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getEvidenceFooterText = (match: SupplierMatch): string => {
    // Determine footer copy based on evidence label
    if (match.evidenceLabel === "customs_matched") {
      return "Verified from customs records.";
    } else if (match.evidenceLabel === "customs_company_only") {
      return "Inferred from customs import data. Verify product match with supplier.";
    } else if (match.evidenceLabel === "signals_limited") {
      return "Matched using product signals. Verify details with supplier.";
    } else {
      return "From supplier database.";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Candidate factories</h3>
            <p className="text-[12px] text-slate-500">Suggested based on product and trade data. Not yet verified.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowLogistics((prev) => !prev)}
          className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          {showLogistics ? "Hide logistics" : "Show logistics"}
        </button>
      </div>

      <div className="px-6 py-5">
        {showingFallback && (
          <p className="text-[12px] text-slate-600 mb-4">
            Showing all available suppliers for your product category.
          </p>
        )}

        {/* Top Candidate */}
        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-slate-900 mb-1">
                {topMatch.supplierName}
              </p>
              {getSupplierRoleDisplay(topMatch) && (
                <p className="text-[13px] text-slate-600 mb-2">{getSupplierRoleDisplay(topMatch)}</p>
              )}
              {(topMatch.location || topMatch.country || topMatch._profile?.country) && (
                <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{topMatch.location || topMatch.country || topMatch._profile?.country}</span>
                </div>
              )}
              {/* Show intel line if available */}
              {showIntel && (
                <p className="text-[12px] text-slate-500 mt-2">
                  {productCount > 0 ? `${productCount} related items` : null}
                  {productCount > 0 && coveragePct > 0 ? " • " : null}
                  {coveragePct > 0 ? `${Math.round(coveragePct)}% price coverage` : null}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {getReasonBadges(topMatch).map((badge, idx) => (
                  <span key={idx} className={`text-[12px] font-medium px-2 py-1 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
              <span className="text-[12px] text-slate-500 mt-2 block">Status: Not verified</span>
            </div>
            {topMatch.matchScore && (
              <span className="text-[12px] font-medium px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded">
                {safePercent(topMatch.matchScore)}%
              </span>
            )}
          </div>
        </div>

        {remainingMatches.length > 0 && (
          <div className="space-y-3 mb-4">
            {visibleRemaining.map((match) => {
              // Safely extract intel fields for each match with nullish coalescing
              const matchProductCount = match._intel?.product_count ?? 0;
              const matchCoveragePct = match._intel?.price_coverage_pct ?? 0;
              const matchShowIntel = matchProductCount > 0 || matchCoveragePct > 0;

              return (
                <div key={match.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-slate-900">
                        {match.supplierName}
                      </p>
                      {getSupplierRoleDisplay(match) && (
                        <p className="text-[13px] text-slate-500">{getSupplierRoleDisplay(match)}</p>
                      )}
                      {/* Show intel line if available */}
                      {matchShowIntel && (
                        <p className="text-[12px] text-slate-500 mt-1">
                          {matchProductCount > 0 ? `${matchProductCount} related items` : null}
                          {matchProductCount > 0 && matchCoveragePct > 0 ? " • " : null}
                          {matchCoveragePct > 0 ? `${Math.round(matchCoveragePct)}% price coverage` : null}
                        </p>
                      )}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {getReasonBadges(match).map((badge, idx) => (
                        <span key={idx} className={`text-[11px] px-2 py-0.5 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>
                    <span className="text-[12px] text-slate-500 mt-1 block">Status: Not verified</span>
                  </div>
                  {match.matchScore && (
                    <span className="text-[12px] text-slate-600">
                      {safePercent(match.matchScore)}%
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors mb-4"
            type="button"
          >
            {showAll ? "Show fewer" : `View ${hiddenCount} more`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
        <p className="text-[12px] text-slate-500">
          {getEvidenceFooterText(topMatch)} Contacts shared after verification starts.
        </p>
      </div>
    </div>
  );
}
