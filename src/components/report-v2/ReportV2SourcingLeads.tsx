// @ts-nocheck
"use client";

import { useState } from "react";
import type { Report } from "@/lib/report/types";
import { Factory, ShoppingBag, Truck, HelpCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { inferCompanyType, shouldExcludeCompanyType, getExclusionReason } from "@/lib/shared/company-type-heuristic";

interface ReportV2SourcingLeadsProps {
  report: Report & {
    _supplierMatches?: Array<any>;
    _questionsChecklist?: {
      title: string;
      items: Array<{ q: string; why: string }>;
    };
  };
}

function SupplierTypeBadge({ type }: { type: string | null | undefined }) {
  if (!type) return null;
  
  const config = {
    Manufacturer: { icon: Factory, color: "bg-blue-50 text-blue-700 border-blue-100" },
    Trading: { icon: ShoppingBag, color: "bg-slate-100 text-slate-600 border-slate-200" },
    Logistics: { icon: Truck, color: "bg-orange-50 text-orange-700 border-orange-100" },
    Unknown: { icon: HelpCircle, color: "bg-slate-50 text-slate-500 border-slate-100" },
  };
  
  const match = config[type as keyof typeof config] || config.Unknown;
  const Icon = match.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${match.color}`}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  );
}

const toTitleCase = (str: string) => {
  if (!str) return "";
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return str;
};

const MatchScoreCircle = ({ score }: { score: number }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const strokeColor = score >= 70 ? "#10b981" : score >= 40 ? "#3b82f6" : "#94a3b8";

  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700">
        {Math.round(score)}%
      </span>
    </div>
  );
};

function EvidenceBadge({ strength }: { strength: string | null | undefined }) {
  if (!strength) return null;
  
  const config = {
    strong: { label: "Strong evidence", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    medium: { label: "Keyword signal", color: "bg-blue-50 text-blue-700 border-blue-100" },
    weak: { label: "NexSupply Verified Pending", color: "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" },
  };
  
  const match = config[strength as keyof typeof config] || config.weak;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${match.color}`}>
      {match.label}
    </span>
  );
}

function MatchConfidenceBadge({ matchScore, rerankScore }: { matchScore?: number | null; rerankScore?: number | null }) {
  // Use rerankScore if available, otherwise fall back to matchScore
  const score = rerankScore ?? matchScore ?? 0;
  
  if (score === 0) return null;
  
  // Determine confidence tier based on score (0-100)
  let tier: "high" | "medium" | "low";
  let color: string;
  let label: string;
  
  if (score >= 70) {
    tier = "high";
    color = "bg-green-100 text-green-800 border-green-200";
    label = `High Match (${Math.round(score)})`;
  } else if (score >= 40) {
    tier = "medium";
    color = "bg-yellow-100 text-yellow-800 border-yellow-200";
    label = `Medium Match (${Math.round(score)})`;
  } else {
    tier = "low";
    color = "bg-orange-100 text-orange-800 border-orange-200";
    label = `Low Match (${Math.round(score)})`;
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`} title={`Match confidence: ${Math.round(score)}/100`}>
      {label}
    </span>
  );
}

// Helper function to clean supplier name (remove synthetic_ prefix, show actual name from trade data)
function cleanSupplierName(supplier: any): string {
  const rawName = supplier.supplier_name || supplier.supplierName || "Unknown Supplier";
  
  // If supplierId starts with synthetic_, it's a fallback candidate - show as Candidate
  if (supplier.supplier_id?.startsWith("synthetic_") || supplier.supplierId?.startsWith("synthetic_")) {
    // Keep the name as formatted in pipeline (already includes "Candidate Factory in...")
    return rawName;
  }
  
  // For real trade data: remove synthetic_ prefix if present, but show actual company name
  // Do NOT mask real company names - show them as-is from ImportKey trade data
  const cleaned = rawName.replace(/^synthetic_/i, "").trim();
  return cleaned || rawName; // Return original if cleaning results in empty string
}

function LeadCard({ supplier, report, questionsChecklist }: { supplier: any; report: Report; questionsChecklist?: ReportV2SourcingLeadsProps["report"]["_questionsChecklist"] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const flags = supplier.flags || {};
  const supplierType = supplier._supplierType?.type || flags.supplierType || flags.type || null;
  const evidenceStrength = flags.evidence_strength || "weak";
  const whyLines = flags.why_lines || [];
  const supplierTypeReason = supplier._supplierType?.reason || null;
  const displayName = toTitleCase(cleanSupplierName(supplier));

  const handleCopyChecklist = () => {
    if (!questionsChecklist) return;
    const text = questionsChecklist.items.map((item, idx) => `${idx + 1}. ${item.q}`).join("\n");
    navigator.clipboard.writeText(text);
  };
  
  // Build "Why shown" summary
  const getWhyShown = () => {
    const anchorHits = flags.anchor_hit || 0;
    const anchors = flags.matched_anchors || [];
    const similarRecords = (report as any)._coverage?.similarRecordsCount || 0;
    if (anchorHits > 0 && anchors.length > 0) {
      return `Keyword signal found for ${anchors.slice(0, 2).join(", ")}`;
    }
    if (similarRecords > 0) {
      return `Similar import signal (${similarRecords})`;
    }
    return "Category signal match";
  };

  const matchScore = supplier.matchScore || supplier.rerankScore || 0;

  return (
    <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-sm">
      {/* Header - Collapsed */}
      <div className="w-full px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {matchScore > 0 && (
            <div className="flex-shrink-0">
              <MatchScoreCircle score={matchScore} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(displayName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block"
            >
              {displayName}
            </a>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-bold uppercase tracking-widest text-slate-400">Analysis:</span> 
              <span className="font-medium">{getWhyShown()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SupplierTypeBadge type={supplierType} />
            <EvidenceBadge strength={evidenceStrength} />
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-400"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5 space-y-5">
          {/* Why this lead */}
          {whyLines.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Validation Logic</div>
              <ul className="space-y-2">
                {whyLines.map((line: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-600 font-medium flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></div>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supplier type reason */}
          {supplierTypeReason && (
            <div className="bg-white p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entity Profile Confidence</div>
              <p className="text-sm text-slate-600 font-medium">{supplierTypeReason}</p>
            </div>
          )}

          {/* What to ask checklist */}
          {questionsChecklist && (
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sourcing Playbook</div>
                <button
                  onClick={handleCopyChecklist}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all uppercase tracking-tight"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy checklist
                </button>
              </div>
              <div className="text-sm font-bold mb-4 text-slate-200">{questionsChecklist.title}</div>
              <ul className="space-y-4">
                {questionsChecklist.items.map((item, idx) => (
                  <li key={idx} className="group">
                    <div className="text-[13px] font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-5 w-5 rounded-md bg-blue-600 flex items-center justify-center text-[10px]">{idx + 1}</span>
                      {item.q}
                    </div>
                    <div className="text-[12px] text-slate-400 pl-7 font-medium leading-relaxed">{item.why}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportV2SourcingLeads({ report }: ReportV2SourcingLeadsProps) {
  const [showExcluded, setShowExcluded] = useState(false);
  const [showRawCustoms, setShowRawCustoms] = useState(false);
  
  const reportAny = report as any;
  const allSupplierMatches = reportAny._supplierMatches || [];
  const questionsChecklist = reportAny._questionsChecklist;
  const category = report.category || "";
  const importKeyCompanies = reportAny.v2?.importKeyCompanies || [];
  const similarRecordsCount = reportAny._coverage?.similarRecordsCount || reportAny._similarRecordsCount || 0;

  // Separate verified vs unverified leads using API arrays when available (fallback to computed logic)
  // Use isVerifiedLead boolean computed on server (deterministic)
  const verifiedLeads = reportAny._recommendedMatches || allSupplierMatches.filter((supplier: any) => {
    return supplier.isVerifiedLead === true;
  });

  const unverifiedLeads = (reportAny._candidateMatches || []).concat(
    reportAny._recommendedMatches 
      ? [] 
      : allSupplierMatches.filter((supplier: any) => supplier.isVerifiedLead !== true && !supplier.isExcluded)
  );

  // Get excluded leads from API or filter by isExcluded flag
  const excludedLeads = reportAny._excludedMatches || allSupplierMatches.filter((supplier: any) => {
    return supplier.isExcluded === true;
  });

  // Fallback filter for food category if not using new API arrays
  const shouldFilter = !reportAny._excludedMatches && (
    category.toLowerCase().includes("food") || 
                      category.toLowerCase().includes("candy") || 
                      category.toLowerCase().includes("snack")
  );
  
  const filteredUnverifiedLeads = shouldFilter
    ? unverifiedLeads.filter((supplier: any) => {
        const companyType = supplier._companyType || supplier.flags?.companyType || inferCompanyType(supplier.supplier_name);
        return !shouldExcludeCompanyType(companyType, category);
      })
    : unverifiedLeads;

  const fallbackExcludedLeads = shouldFilter
    ? unverifiedLeads.filter((supplier: any) => {
        const companyType = supplier._companyType || supplier.flags?.companyType || inferCompanyType(supplier.supplier_name);
        return shouldExcludeCompanyType(companyType, category);
      })
    : [];

  // Use new API excluded leads if available, otherwise fallback
  const finalExcludedLeads = reportAny._excludedMatches ? excludedLeads : fallbackExcludedLeads;

  const handleCopyChecklist = () => {
    if (!questionsChecklist) return;
    const text = questionsChecklist.items.map((item, idx) => `${idx + 1}. ${item.q}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  const hasAnySuppliers = verifiedLeads.length > 0 || filteredUnverifiedLeads.length > 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sourcing Leads</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Discovery through global trade records and network matching.</p>
        </div>
        {hasAnySuppliers && (
          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            {verifiedLeads.length + filteredUnverifiedLeads.length} Matches Found
          </div>
        )}
      </div>
      
      {!hasAnySuppliers ? (
        /* Empty State - No Public Export Records */
        <div className="border border-amber-200 rounded-2xl p-10 bg-gradient-to-br from-amber-50/50 to-white text-center">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100/50 mb-6">
              <HelpCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">No public export records found</h3>
            <p className="text-sm text-slate-600 font-medium mb-8 leading-relaxed">
              We searched 300,000+ public trade records but couldn't find exact matches for this specific product. 
              This often means suppliers use private networks or alternative descriptions.
            </p>
            
            {/* Premium Verification CTA */}
            <div className="bg-white rounded-2xl border border-blue-200 p-8 shadow-xl shadow-blue-500/5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Factory className="w-24 h-24 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                🔓 Unlock Private Network Factories
              </h4>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Get access to 4+ verified factories from our private network, plus manual sourcing by our regional experts.
              </p>
              <button className="w-full h-14 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase tracking-tight text-base active:scale-[0.98]">
                Unlock Premium Verification — $49
              </button>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">✓ Manual Sourcing</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">✓ Vetted Contacts</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">✓ Direct Quotes</div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">
              Or contact us at <a href="mailto:support@nexsupply.com" className="text-blue-600 hover:underline">support@nexsupply.com</a> for assistance.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {hasTradingLeads && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-start gap-4 mb-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-16 h-16 text-slate-900" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <HelpCircle className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 pr-10">
                <p className="text-sm text-slate-900 leading-relaxed font-medium">
                  <strong>Public data mostly shows trading intermediaries.</strong> Unlock the Full Blueprint to find direct factories with <span className="text-emerald-600 font-bold">15-20% better pricing tiers</span> and lower MOQs.
                </p>
              </div>
            </div>
          )}

          {/* Suggested Suppliers (Verified) */}
          {verifiedLeads.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4 pl-1">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Recommended Match Cluster</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100 uppercase tracking-tight">
                  {verifiedLeads.length} Verified Records
                </span>
              </div>
              <div className="space-y-4 pr-1">
                {verifiedLeads.map((supplier: any) => (
                  <LeadCard
                    key={supplier.id || supplier.supplier_id}
                    supplier={supplier}
                    report={report}
                    questionsChecklist={questionsChecklist}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unverified Leads - Always visible */}
          {filteredUnverifiedLeads.length > 0 && (
            <div>
              <div className="mb-4 pl-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">NexSupply Verified Pending</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-500 rounded-md border border-slate-200 uppercase tracking-tight">
                    {filteredUnverifiedLeads.length} Candidates
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Potential matches based on cross-category trade signals. Manual audit required.
                </p>
              </div>
              <div className="space-y-4 pr-1">
                {filteredUnverifiedLeads.map((supplier: any) => (
                  <LeadCard
                    key={supplier.id || supplier.supplier_id}
                    supplier={supplier}
                    report={report}
                    questionsChecklist={questionsChecklist}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Excluded Leads */}
          {finalExcludedLeads.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Low Confidence Signals</h3>
                <button
                  onClick={() => setShowExcluded(!showExcluded)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 uppercase tracking-tight"
                >
                  {showExcluded ? "Hide" : "Show"} filtered ({finalExcludedLeads.length})
                  {showExcluded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showExcluded && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {finalExcludedLeads.map((supplier: any) => {
                    const flags = supplier.flags || {};
                    const excludedReason = flags.excluded_reason || "unknown";
                    
                    const getReasonLabel = (reason: string) => {
                      const reasonMap: Record<string, string> = {
                        "logistics_only": "Logistics Only",
                        "low_quality": "Weak Data Signal",
                        "toy_mismatch": "Category Mismatch",
                        "food_mismatch": "Category Mismatch",
                        "duplicate": "Duplicate Entity",
                      };
                      return reasonMap[reason] || reason;
                    };
                    
                    const reasonLabel = getReasonLabel(excludedReason);
                    
                    const getReasonColor = (reason: string) => {
                      if (reason.includes("logistics")) return "text-orange-600 bg-orange-50 border-orange-100";
                      return "text-slate-500 bg-slate-50 border-slate-200";
                    };
                    
                    return (
                      <div key={supplier.id || supplier.supplier_id} className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{toTitleCase(cleanSupplierName(supplier))}</div>
                        </div>
                        <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${getReasonColor(excludedReason)}`}>
                          {reasonLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Raw Customs Companies */}
      {importKeyCompanies.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Raw Customs Context</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200 uppercase tracking-tight">
                  {importKeyCompanies.length} Entities
                </span>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">
                Unvetted list showing general import activity in this product cluster.
              </p>
            </div>
            <button
              onClick={() => setShowRawCustoms(!showRawCustoms)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all uppercase tracking-tight"
            >
              {showRawCustoms ? "Hide Data" : "View Raw Data"}
            </button>
          </div>
          {showRawCustoms && (
            <div className="space-y-6">
              {/* Disclaimer */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                  <strong>Cluster Analysis:</strong> This list identifies companies involved in imports similar to your product. While these companies show relevant activity, contact information and vetted capabilities require the Premium Factory Blueprint. Based on {similarRecordsCount} global records.
                </p>
              </div>

              {/* Company List */}
              <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200/60">
                      <tr>
                        <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entity Name</th>
                        <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inferred Role</th>
                        <th className="text-right py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Volume</th>
                        <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                        <th className="text-left py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importKeyCompanies.slice(0, 20).map((company: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-slate-900 font-bold tracking-tight">{toTitleCase(company.companyName)}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight px-2 py-0.5 bg-slate-100 rounded-md">{company.role}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900 font-medium">{company.shipmentsCount}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium text-xs">
                            {company.lastSeen 
                              ? new Date(company.lastSeen).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-bold text-[11px] uppercase tracking-tight">{company.originCountry || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importKeyCompanies.length > 20 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">
                    Showing top 20 of {importKeyCompanies.length} cluster matches
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
