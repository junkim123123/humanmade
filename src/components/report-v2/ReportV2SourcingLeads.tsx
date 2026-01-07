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
    Manufacturer: { icon: Factory, color: "bg-blue-100 text-blue-800" },
    Trading: { icon: ShoppingBag, color: "bg-purple-100 text-purple-800" },
    Logistics: { icon: Truck, color: "bg-orange-100 text-orange-800" },
    Unknown: { icon: HelpCircle, color: "bg-slate-100 text-slate-800" },
  };
  
  const match = config[type as keyof typeof config] || config.Unknown;
  const Icon = match.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${match.color}`}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  );
}

function EvidenceBadge({ strength }: { strength: string | null | undefined }) {
  if (!strength) return null;
  
  const config = {
    strong: { label: "Strong evidence", color: "bg-green-100 text-green-800" },
    medium: { label: "Keyword signal", color: "bg-yellow-100 text-yellow-800" },
    weak: { label: "NexSupply Verified Pending", color: "bg-slate-100 text-slate-800" },
  };
  
  const match = config[strength as keyof typeof config] || config.weak;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${match.color}`}>
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
  const [isExpanded, setIsExpanded] = useState(true);
  const flags = supplier.flags || {};
  const supplierType = supplier._supplierType?.type || flags.supplierType || flags.type || null;
  const evidenceStrength = flags.evidence_strength || "weak";
  const whyLines = flags.why_lines || [];
  const supplierTypeReason = supplier._supplierType?.reason || null;
  const displayName = cleanSupplierName(supplier);

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

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header - Collapsed */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(displayName)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded"
            >
              {displayName}
            </a>
            <div className="text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-600">Match reason:</span> {getWhyShown()}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <MatchConfidenceBadge matchScore={supplier.matchScore} rerankScore={supplier.rerankScore} />
            <SupplierTypeBadge type={supplierType} />
            <EvidenceBadge strength={evidenceStrength} />
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
          {/* Why this lead */}
          {whyLines.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Why this lead</div>
              <ul className="space-y-1">
                {whyLines.map((line: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supplier type reason */}
          {supplierTypeReason && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">Why this type</div>
              <p className="text-xs text-slate-600">{supplierTypeReason}</p>
            </div>
          )}

          {/* What to ask checklist */}
          {questionsChecklist && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-slate-700">What to ask</div>
                <button
                  onClick={handleCopyChecklist}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-white rounded border border-slate-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy checklist
                </button>
              </div>
              <div className="text-xs text-slate-500 mb-2">{questionsChecklist.title}</div>
              <ul className="space-y-2">
                {questionsChecklist.items.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-700">
                    <div className="font-medium">{idx + 1}. {item.q}</div>
                    <div className="text-slate-500 mt-0.5">{item.why}</div>
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
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Sourcing leads</h2>
      
      {!hasAnySuppliers ? (
        /* Empty State */
        <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-slate-900 mb-2">No supplier matches found yet</h3>
            <p className="text-sm text-slate-600">
              We did not find matches in recent customs data for this product yet. We'll keep scanning category suppliers and related records.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Suggested Suppliers (Verified) */}
          {verifiedLeads.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Suggested suppliers</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {verifiedLeads.length} {verifiedLeads.length === 1 ? 'match' : 'matches'}
                </span>
              </div>
              <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
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
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">NexSupply Verified Pending</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                    {filteredUnverifiedLeads.length} {filteredUnverifiedLeads.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Potential matches based on category and keywords. Click company name to search.
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Excluded</h3>
                <button
                  onClick={() => setShowExcluded(!showExcluded)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  {showExcluded ? "Hide" : "Show"} excluded ({finalExcludedLeads.length})
                  {showExcluded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showExcluded && (
                <div className="space-y-2">
                  {finalExcludedLeads.map((supplier: any) => {
                    const flags = supplier.flags || {};
                    const excludedReason = flags.excluded_reason || "unknown";
                    
                    // Map exclusion reason to display text
                    const getReasonLabel = (reason: string) => {
                      const reasonMap: Record<string, string> = {
                        "logistics_only": "Logistics company",
                        "low_quality": "Low-quality match",
                        "toy_mismatch": "Toy company",
                        "food_mismatch": "Food-only supplier",
                        "duplicate": "Duplicate",
                      };
                      return reasonMap[reason] || reason;
                    };
                    
                    const reasonLabel = getReasonLabel(excludedReason);
                    
                    // Determine badge color based on reason
                    const getReasonColor = (reason: string) => {
                      if (reason.includes("logistics")) return "bg-orange-100 text-orange-700";
                      if (reason.includes("toy")) return "bg-purple-100 text-purple-700";
                      if (reason.includes("food")) return "bg-amber-100 text-amber-700";
                      if (reason.includes("quality")) return "bg-red-100 text-red-700";
                      return "bg-slate-100 text-slate-700";
                    };
                    
                    return (
                      <div key={supplier.id || supplier.supplier_id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{cleanSupplierName(supplier)}</div>
                        </div>
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getReasonColor(excludedReason)}`}>
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
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">Raw customs companies</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                  {importKeyCompanies.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Customs-derived company list. Shows import activity but not vetted as recommendations.
              </p>
            </div>
            <button
              onClick={() => setShowRawCustoms(!showRawCustoms)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 flex-shrink-0"
            >
              {showRawCustoms ? "Hide" : "Show"}
              {showRawCustoms ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          {showRawCustoms && (
            <div className="space-y-4">
              {/* Disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Trust context:</strong> This raw list shows companies involved in similar imports. Increases transparency but contact info not included. Based on {similarRecordsCount} customs record{similarRecordsCount === 1 ? "" : "s"}.
                </p>
              </div>

              {/* Company List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-3 text-slate-600 font-medium">Company</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-medium">Role</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-medium">Shipments</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-medium">Last seen</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-medium">Origin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importKeyCompanies.slice(0, 20).map((company: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-900 font-medium">{company.companyName}</td>
                          <td className="py-2 px-3 text-slate-600">{company.role}</td>
                          <td className="py-2 px-3 text-right text-slate-900">{company.shipmentsCount}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {company.lastSeen 
                              ? new Date(company.lastSeen).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{company.originCountry || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importKeyCompanies.length > 20 && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 text-center">
                    Showing top 20 of {importKeyCompanies.length} companies
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
