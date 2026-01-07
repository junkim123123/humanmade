// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, ShoppingBag, Truck, HelpCircle, Copy, Download, Mail, ChevronDown, ChevronUp } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { buildLeadEvidenceSentence, buildCoverageLine, buildWhyThisLeadBullets } from "./leadEvidenceHelpers";

interface ConfidencePillProps {
  label: "Evidence backed" | "Likely lead" | "Weak lead";
  helper?: string;
}

function ConfidencePill({ label, helper }: ConfidencePillProps) {
  const getBadgeStyle = () => {
    switch (label) {
      case "Evidence backed":
        return "bg-green-50 text-green-700 border-green-200";
      case "Likely lead":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Weak lead":
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Badge variant="outline" className={`h-4 px-1.5 text-xs border ${getBadgeStyle()}`}>
      {label}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: "not_started" | "outreach_sent" | "reply_received" | "parsed" | "needs_followup" | "confirmed_in_writing";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "not_started":
        return { label: "Not started", className: "bg-slate-50 text-slate-700 border-slate-200" };
      case "outreach_sent":
        return { label: "Outreach sent", className: "bg-blue-50 text-blue-700 border-blue-200" };
      case "reply_received":
        return { label: "Reply received", className: "bg-purple-50 text-purple-700 border-purple-200" };
      case "parsed":
        return { label: "Parsed", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "needs_followup":
        return { label: "Needs followup", className: "bg-orange-50 text-orange-700 border-orange-200" };
      case "confirmed_in_writing":
        return { label: "Confirmed in writing", className: "bg-green-50 text-green-700 border-green-200" };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={`h-4 px-1.5 text-xs border ${config.className}`}>
      {config.label}
    </Badge>
  );
}

interface LeadCardProps {
  supplier: any;
  report: Report;
  onCopyMessage: (supplier: any) => void;
  onDownloadChecklist: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  status?: "not_started" | "outreach_sent" | "reply_received" | "parsed" | "needs_followup" | "confirmed_in_writing" | null;
  confirmedInWriting?: boolean;
}

export function LeadCard({
  supplier,
  report,
  onCopyMessage,
  onDownloadChecklist,
  isExpanded,
  onToggleExpand,
  status,
  confirmedInWriting = false,
}: LeadCardProps) {
  const flags = supplier.flags || {};
  const intel = supplier._intel;
  const enrichment = supplier._enrichment;
  const reportAny = report as any;
  const marketEstimate = reportAny._marketEstimate;

  // Determine supplier type from various sources (profile role first)
  const supplierType = (() => {
    // Use profile role first (from entity resolution)
    if (supplier.role || supplier._profile?.role) {
      return supplier.role || supplier._profile?.role;
    }
    
    if (flags.supplierType || flags.type) return flags.supplierType || flags.type;
    
    // Check enrichment role percentages
    if (enrichment?.role_factory_pct && enrichment.role_factory_pct > 50) return "factory";
    if (enrichment?.role_trading_pct && enrichment.role_trading_pct > 50) return "trading";
    if (enrichment?.role_logistics_pct && enrichment.role_logistics_pct > 50) return "logistics";
    
    // Check flags
    if (flags.type_factory) return "factory";
    if (flags.type_trading) return "trading";
    if (flags.type_logistics) return "logistics";
    
    return "unknown";
  })();
  
  const getSupplierTypeIcon = (type: string) => {
    switch (type) {
      case "factory":
        return Factory;
      case "trading":
        return ShoppingBag;
      case "logistics":
        return Truck;
      default:
        return HelpCircle;
    }
  };

  const getSupplierTypeBadgeColor = (type: string) => {
    switch (type) {
      case "factory":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "trading":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "logistics":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "factory":
        return "Factory";
      case "trading":
        return "Trader";
      case "logistics":
        return "Logistics";
      default:
        return "Unknown";
    }
  };

  const Icon = getSupplierTypeIcon(supplierType);
  const badgeColor = getSupplierTypeBadgeColor(supplierType);

  // Get lead confidence
  const getLeadConfidence = (): { label: "Evidence backed" | "Likely lead" | "Weak lead" } => {
    // Extract values from flags and evidence
    const anchorHits = flags.anchor_hit || (supplier.evidence?.anchorHits ? (typeof supplier.evidence.anchorHits === 'number' ? supplier.evidence.anchorHits : 0) : 0);
    const brandPhraseHits = flags.brand_phrase_hit || (supplier.evidence?.brandPhraseHits ? (typeof supplier.evidence.brandPhraseHits === 'number' ? supplier.evidence.brandPhraseHits : 0) : 0);
    const isLogistics = flags.type_logistics || supplierType === "logistics";
    const matchScore = supplier.match_score || 0;
    const rerankScore = supplier.rerank_score || 0;
    const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
    
    // Evidence backed: strong signal from keywords or similar records
    // Conditions: (anchor_hit >= 2 OR brand_phrase_hit >= 1) AND not logistics AND (matchScore >= 30 OR rerankScore >= 70)
    if (
      (anchorHits >= 2 || brandPhraseHits >= 1) &&
      !isLogistics &&
      (matchScore >= 30 || rerankScore >= 70)
    ) {
      return {
        label: "Evidence backed"
      };
    }
    
    // Likely lead: some evidence but not as strong
    // Conditions: category inference OR matchScore >= 15 OR hsCandidatesCount >= 2 OR has any anchor hits
    const isFallback = !flags.anchor_hit && anchorHits === 0 && !flags.category_hit;
    const isCategoryBased = flags.category_hit || (!flags.anchor_hit && anchorHits === 0) || supplier.tier === "candidate";
    
    if (
      isFallback ||
      isCategoryBased ||
      matchScore >= 15 ||
      hsCandidatesCount >= 2 ||
      anchorHits > 0
    ) {
      return {
        label: "Likely lead"
      };
    }
    
    // Weak lead: otherwise
    return {
      label: "Weak lead"
    };
  };

  const confidence = getLeadConfidence();

  // Build evidence sentence using helper
  const reportContext = {
    similarRecordsCount: reportAny._similarRecordsCount || 0,
  };
  const evidenceSentence = buildLeadEvidenceSentence(supplier, intel, reportContext);
  const coverageChips = buildCoverageLine(supplier, intel);
  const whyThisLeadBullets = buildWhyThisLeadBullets(supplier, intel, reportContext);

  // What we need - determine which 2 items to show
  const getWhatWeNeed = (): string[] => {
    const needs: string[] = [];
    const hasPrice = supplier.unit_price && supplier.unit_price > 0;
    const hasMOQ = intel?.moq_median && intel.moq_median > 0;
    
    // Always prioritize confirmed unit price and MOQ/lead time
    if (!hasPrice) {
      needs.push("Confirmed unit price");
    }
    
    if (!hasMOQ) {
      needs.push("MOQ and lead time");
    }
    
    // If we already have both, show alternatives
    if (needs.length === 0) {
      needs.push("Packaging spec and barcode");
      needs.push(`Certifications for ${report.category}`);
    } else if (needs.length === 1) {
      // Have one, add the missing one
      if (!hasPrice) {
        needs.push("MOQ and lead time");
      } else {
        needs.push("MOQ and lead time");
      }
    }
    
    // Ensure exactly 2 items
    return needs.slice(0, 2);
  };

  const whatWeNeed = getWhatWeNeed();

  return (
    <div className="border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      {/* Block 1: Header */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {supplier.supplier_name || "Unknown supplier"}
              </h3>
              <Badge variant="outline" className={`h-4 px-1.5 text-xs border ${badgeColor}`}>
                {getTypeLabel(supplierType)}
              </Badge>
              {/* Supplier type badge (from inference) */}
              {(() => {
                const supplierTypeInference = supplier._supplierType;
                if (supplierTypeInference) {
                  const getSupplierTypeBadgeStyle = () => {
                    switch (supplierTypeInference.type) {
                      case "Manufacturer":
                        return "bg-blue-50 text-blue-700 border-blue-200";
                      case "Trading":
                        return "bg-purple-50 text-purple-700 border-purple-200";
                      case "Logistics":
                        return "bg-orange-50 text-orange-700 border-orange-200";
                      case "Unknown":
                        return "bg-slate-50 text-slate-600 border-slate-200";
                      default:
                        return "bg-slate-50 text-slate-600 border-slate-200";
                    }
                  };
                  return (
                    <Badge variant="outline" className={`h-4 px-1.5 text-xs border ${getSupplierTypeBadgeStyle()}`}>
                      {supplierTypeInference.type}
                    </Badge>
                  );
                }
                return null;
              })()}
              {/* Evidence strength badge */}
              {(() => {
                const evidenceStrength = flags.evidence_strength || "weak";
                const getEvidenceBadgeStyle = () => {
                  switch (evidenceStrength) {
                    case "strong":
                      return "bg-green-50 text-green-700 border-green-200";
                    case "medium":
                      return "bg-amber-50 text-amber-700 border-amber-200";
                    case "weak":
                      return "bg-slate-50 text-slate-600 border-slate-200";
                    default:
                      return "bg-slate-50 text-slate-600 border-slate-200";
                  }
                };
                const getEvidenceLabel = () => {
                  switch (evidenceStrength) {
                    case "strong":
                      return "Strong evidence";
                    case "medium":
                      return "Some evidence";
                    case "weak":
                      return "Analyzing Industry Benchmarks";
                    default:
                      return "Analyzing Industry Benchmarks";
                  }
                };
                return (
                  <>
                    <Badge variant="outline" className={`h-4 px-1.5 text-xs border ${getEvidenceBadgeStyle()}`}>
                      {getEvidenceLabel()}
                    </Badge>
                    {evidenceStrength === "weak" && (
                      <span className="text-[10px] text-slate-500 ml-1">
                        Inferred from category signals and limited history
                      </span>
                    )}
                  </>
                );
              })()}
              {confirmedInWriting ? (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-xs bg-green-50 text-green-700 border-green-200"
                >
                  Confirmed quote
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Not verified quote
                </Badge>
              )}
              {status && (
                <StatusBadge status={status} />
              )}
            </div>
            {/* Evidence sentence - Line 1 */}
            <div className="mb-1.5">
              <p className="text-xs text-slate-700 leading-relaxed">{evidenceSentence}</p>
            </div>
            
            {/* Coverage line - Line 2 */}
            {coverageChips.length > 0 && (
              <div className="mb-2 flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                {coverageChips.map((chip, idx) => (
                  <span key={idx} className="inline-flex items-center">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {chip}
                    </span>
                    {idx < coverageChips.length - 1 && (
                      <span className="mx-1 text-slate-400">•</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            
            {/* Evidence chips and risk tags */}
            {(enrichment?.risk_tags && enrichment.risk_tags.length > 0) && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-1.5">Risk tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {enrichment.risk_tags.map((tag: string, idx: number) => {
                    const getTagLabel = (tag: string): string => {
                      if (tag === "logistics_company") return "Logistics";
                      if (tag === "unconfirmed_manufacturer") return "Unconfirmed manufacturer";
                      if (tag === "no_product_history") return "No product history";
                      if (tag === "low_quality_identifier") return "Low quality identifier";
                      return tag;
                    };
                    
                    const getTagColor = (tag: string): string => {
                      if (tag === "logistics_company") return "bg-yellow-50 text-yellow-700 border-yellow-200";
                      if (tag === "unconfirmed_manufacturer") return "bg-amber-50 text-amber-700 border-amber-200";
                      if (tag === "no_product_history") return "bg-slate-50 text-slate-600 border-slate-200";
                      return "bg-slate-50 text-slate-600 border-slate-200";
                    };
                    
                    return (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={`h-5 px-2 text-xs border ${getTagColor(tag)}`}
                      >
                        {getTagLabel(tag)}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Block 3: What we need */}
      <div className="p-3 border-b border-slate-100">
        <div className="text-xs font-medium text-slate-700 mb-2">What we need</div>
        <ul className="space-y-1.5 text-xs text-slate-600 mb-3">
          {whatWeNeed.map((need, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{need}</span>
            </li>
          ))}
        </ul>

        {/* Free actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyMessage(supplier)}
            className="flex-1 h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-3 h-3 mr-1.5" />
            Copy outreach message
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadChecklist}
            className="flex-1 h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3 h-3 mr-1.5" />
            Download checklist
          </Button>
        </div>
      </div>

      {/* Paid action - Only show if not already in a sourcing job or if status is not_started */}
      {(!status || status === "not_started") && (
        <div className="p-3 bg-blue-50 border-b border-slate-100">
          <div className="text-xs text-slate-600 mb-2 text-center">
            <strong>Paid service:</strong> We contact suppliers and confirm quotes in writing. Quotes are only shown as confirmed when confirmed_in_writing is true.
          </div>
          <div className="text-xs text-slate-500 text-center">
            Use the "Run outreach with NexSupply" button in the Sourcing Copilot header above to start.
          </div>
        </div>
      )}

      {/* Expand button */}
      <div className="p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="w-full h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Show details
            </>
          )}
        </Button>
      </div>

      {/* Expanded drawer */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-3">
          {/* Confidence pill in expanded header */}
          <div className="pb-2 border-b border-slate-200">
            <ConfidencePill label={confidence.label} />
          </div>
          
          {/* Why this lead block */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1.5">Why this lead</div>
            {(() => {
              const whyLines = (flags.why_lines as string[]) || [];
              const displayLines = whyLines.length > 0 
                ? whyLines 
                : ["Based on category inference and internal dataset signals"];
              
              return (
                <ul className="text-xs text-slate-600 space-y-1">
                  {displayLines.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
          
          {/* Why this type block */}
          {supplier._supplierType && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">Why this type</div>
              <div className="text-xs text-slate-600">
                {supplier._supplierType.reason}
              </div>
            </div>
          )}
          
          {/* Examples in our dataset */}
          {(() => {
            const exampleProducts = supplier._exampleProducts as Array<{ product_name: string; category?: string; unit_price?: number }> | undefined;
            if (!exampleProducts || exampleProducts.length === 0) {
              return (
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1.5">Examples in our dataset</div>
                  <div className="text-xs text-slate-500">No internal examples yet</div>
                </div>
              );
            }
            
            return (
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1.5">Examples in our dataset</div>
                <ul className="text-xs text-slate-600 space-y-1">
                  {exampleProducts.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span>{example.product_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          
          {/* Next questions (from enrichment) */}
          {enrichment && enrichment.next_questions && enrichment.next_questions.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">What to ask</div>
              <ul className="text-xs text-slate-600 space-y-1">
                {enrichment.next_questions.map((question: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing stats (if available) */}
          {intel && intel.price_min && intel.price_max && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">Pricing</div>
              <div className="text-xs text-slate-600">
                Range: ${intel.price_min.toFixed(2)} - ${intel.price_max.toFixed(2)}
                {intel.price_median && ` (median: $${intel.price_median.toFixed(2)})`}
                <br />
                Coverage: {intel.price_coverage_pct.toFixed(0)}% of records
              </div>
            </div>
          )}

          {/* MOQ median */}
          {intel && intel.moq_median && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">MOQ</div>
              <div className="text-xs text-slate-600">Median: {intel.moq_median.toLocaleString()} units</div>
            </div>
          )}

          {/* Sample products */}
          {intel && intel.sample_products && intel.sample_products.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">Sample products</div>
              <div className="text-xs text-slate-600">
                {intel.sample_products.slice(0, 3).join(", ")}
                {intel.product_count > 3 && ` +${intel.product_count - 3} more`}
              </div>
            </div>
          )}

          {/* Profile status */}
          {(!supplier.shipment_count_12m && (!intel || !intel.product_count || intel.product_count === 0)) && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">Profile status</div>
              <div className="text-xs text-slate-600">
                Limited profile data for this lead. We enrich as we observe more shipments.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

