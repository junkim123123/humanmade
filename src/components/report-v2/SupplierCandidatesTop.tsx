"use client";

import { useState } from "react";
import { Building2, MapPin, ChevronDown, ShieldCheck, Zap } from "lucide-react";
import { safePercent } from "@/lib/format/percent";

const getMatchConfidenceBadge = (score: number) => {
  if (score >= 80) return { label: "High Match", color: "text-emerald-700" };
  if (score >= 50) return { label: "Medium Match", color: "text-blue-700" };
  return { label: "Potential Match", color: "text-slate-600" };
};

const MatchScoreCircle = ({ score }: { score: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { color } = getMatchConfidenceBadge(score);
  
  const strokeColor = score >= 80 ? "#10b981" : score >= 50 ? "#3b82f6" : "#94a3b8";

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={strokeColor}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-[12px] font-bold ${color}`}>
        {Math.round(score)}%
      </span>
    </div>
  );
};

const toTitleCase = (str: string) => {
  if (!str) return "";
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return str;
};

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
  onUnlock?: () => void;
}

export default function SupplierCandidatesTop({ matches, onUnlock }: SupplierCandidatesTopProps) {
  const [showAll, setShowAll] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);

  if (!matches || matches.length === 0) {
    // Show empty state message so the section exists
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-[16px] font-semibold text-slate-900">Public Trade Data Matches</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-slate-600">No public trade data matches available for this product.</p>
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
      badges.push({ label: "Customs records", color: "bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold" });
    } else if (match.evidenceLabel === "customs_company_only") {
      badges.push({ label: "Customs company only", color: "bg-blue-100 text-blue-700" });
    } else if (match.evidenceLabel === "signals_limited") {
      badges.push({ label: "Signals limited", color: "bg-amber-100 text-amber-700" });
    } else {
      badges.push({ label: "Keyword match", color: "bg-slate-100 text-slate-700" });
    }
    
    // Check for FDA registration in reasonBadges
    if (match.reasonBadges && match.reasonBadges.some(b => b.toLowerCase().includes("fda"))) {
      badges.push({ label: "FDA registration", color: "bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold" });
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

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
      <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Public Trade Data Matches</h3>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Initial discovery based on general export records.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowLogistics((prev) => !prev)}
          className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-tight"
        >
          {showLogistics ? "Hide logistics" : "Show logistics"}
        </button>
      </div>

      <div className="px-6 py-6">
        {showingFallback && (
          <p className="text-[12px] text-slate-600 mb-4 font-medium italic">
            Showing all available public trade data matches for your product category.
          </p>
        )}

        {/* Top Candidate */}
        <div className="p-6 border border-slate-200/80 rounded-2xl bg-slate-50/50 mb-6 group hover:border-blue-200 transition-all hover:shadow-md hover:shadow-blue-500/5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {toTitleCase(topMatch.supplierName || topMatch.supplier_name || topMatch.companyName || "Factory Name Unavailable")}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[11px] px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg font-bold uppercase tracking-tight animate-pulse">
                    NexSupply Verified Pending
                  </span>
                  <span className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg font-bold uppercase tracking-tight">
                    Source: Trade Data
                  </span>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {getSupplierRoleDisplay(topMatch) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span>{getSupplierRoleDisplay(topMatch)}</span>
                  </div>
                )}
                {(topMatch.location || topMatch.country || topMatch._profile?.country) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{topMatch.location || topMatch.country || topMatch._profile?.country}</span>
                  </div>
                )}
              </div>

              {/* Show intel line if available */}
              {showIntel && (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mb-4">
                  {productCount > 0 ? `${productCount} related items` : null}
                  {productCount > 0 && coveragePct > 0 ? " • " : null}
                  {coveragePct > 0 ? `${Math.round(coveragePct)}% price coverage` : null}
                </p>
              )}
              
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {getReasonBadges(topMatch).map((badge, idx) => (
                  <span key={idx} className={`text-[12px] font-bold px-3 py-1.5 rounded-xl border border-transparent shadow-sm ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* NexSupply Intel Potential */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden group/intel">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] transform translate-x-1/4 -translate-y-1/4 group-hover/intel:scale-110 transition-transform">
                  <Zap className="w-24 h-24 text-blue-600" fill="currentColor" />
                </div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-tight mb-1">NexSupply Intel Potential</p>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      Our network indicates 4 alternative manufacturers in this cluster with <span className="text-emerald-600 font-bold">15-20% better price tiers</span>.
                    </p>
                    <button 
                      onClick={onUnlock}
                      className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-tight"
                    >
                      Start Verification to access
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {topMatch.matchScore && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match Score</p>
                <MatchScoreCircle score={topMatch.matchScore} />
                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tight ${topMatch.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700' : topMatch.matchScore >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
                  {getMatchConfidenceBadge(topMatch.matchScore).label}
                </div>
              </div>
            )}
          </div>
        </div>

        {remainingMatches.length > 0 && (
          <div className="space-y-4 mb-6">
            {visibleRemaining.map((match) => {
              const matchProductCount = match._intel?.product_count ?? 0;
              const matchCoveragePct = match._intel?.price_coverage_pct ?? 0;
              const matchShowIntel = matchProductCount > 0 || matchCoveragePct > 0;

              return (
                <div key={match.id} className="p-5 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50/50 transition-all hover:border-slate-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 mb-2 truncate tracking-tight">
                        {toTitleCase(match.supplierName || match.supplier_name || match.companyName || "Factory Name Unavailable")}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold uppercase tracking-tight">
                          Unverified Data
                        </span>
                        {getSupplierRoleDisplay(match) && (
                          <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-bold uppercase tracking-tight">
                            {getSupplierRoleDisplay(match)}
                          </span>
                        )}
                      </div>

                      {matchShowIntel && (
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight mb-3">
                          {matchProductCount > 0 ? `${matchProductCount} items` : null}
                          {matchProductCount > 0 && matchCoveragePct > 0 ? " • " : null}
                          {matchCoveragePct > 0 ? `${Math.round(matchCoveragePct)}% coverage` : null}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getReasonBadges(match).map((badge, idx) => (
                          <span key={idx} className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-tight border border-transparent ${badge.color}`}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {match.matchScore && (
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <MatchScoreCircle score={match.matchScore} />
                      </div>
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
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-tight"
            type="button"
          >
            {showAll ? "Show fewer" : `View ${hiddenCount} more candidates`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div className="px-6 py-6 border-t border-slate-100 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              Optimized Sourcing Available
            </p>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
              Public trade data is just the beginning. Our network intelligence filters for factories with direct pricing and superior MOQ tiers. 
              <span 
                onClick={onUnlock}
                className="text-blue-600 font-bold ml-1 hover:underline cursor-pointer uppercase tracking-tight text-[11px]"
              >
                Unlock Full Blueprint
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
