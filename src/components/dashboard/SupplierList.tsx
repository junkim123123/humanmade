// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Factory, Star, Package, Clock, DollarSign, Sparkles, Globe, AlertCircle, TrendingUp, Building2, ShoppingBag, Truck, HelpCircle, CheckCircle2, Info } from "lucide-react";
import type { SupplierMatch, MarketEstimate, SupplierType } from "@/lib/intelligence-pipeline";
import { QuoteModal } from "./QuoteModal";
import { FollowUpInputCard } from "./FollowUpInputCard";

interface SupplierListProps {
  suppliers?: SupplierMatch[]; // For backward compatibility
  recommendedSuppliers?: SupplierMatch[]; // Perfect matches only
  candidateSuppliers?: SupplierMatch[]; // Inferred or lower-score matches
  marketEstimate?: MarketEstimate;
}

/**
 * Compact long text for display (e.g., manifest descriptions)
 */
function compactEvidence(text?: string, max = 140): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

/**
 * Get supplier type badge icon and label
 */
function getSupplierTypeBadge(type?: SupplierType) {
  switch (type) {
    case "factory":
      return { icon: Factory, label: "Factory", color: "bg-blue-100 text-blue-700" };
    case "trading":
      return { icon: ShoppingBag, label: "Trading", color: "bg-purple-100 text-purple-700" };
    case "logistics":
      return { icon: Truck, label: "Logistics", color: "bg-orange-100 text-orange-700" };
    default:
      return { icon: HelpCircle, label: "Unknown", color: "bg-slate-100 text-slate-700" };
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "Unknown";
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function MarketEstimateCard({ estimate }: { estimate: MarketEstimate }) {
  const price = estimate?.fobUnitPriceRange || estimate?.fobPriceRange;
  const moq = estimate?.moqRange;
  const lead = estimate?.leadTimeRange;
  const countries = estimate?.primaryProductionCountries ?? [];
  const risks = estimate?.riskChecklist ?? [];
  const hs = estimate?.hsCodeCandidates ?? [];
  const packMath = estimate?.packMath;
  const recentImporters = estimate?.recentImporters ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Market Estimate</h2>
          <p className="text-sm text-slate-600 mt-1">
            No exact matches found. Here is a realistic baseline.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          Estimate
        </span>
      </div>

      {/* Order Reality Check - MOQ and Lead Time at Top */}
      {(moq || lead) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Order reality check</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {moq && (
              <div>
                <div className="text-blue-600 mb-1">Typical MOQ</div>
                <div className="font-bold text-blue-900 text-base">
                  {moq.typical.toLocaleString()} units
                </div>
                {packMath?.unitsPerCarton && (
                  <div className="text-blue-700 mt-1">
                    ≈ {Math.ceil(moq.typical / packMath.unitsPerCarton)} cartons
                  </div>
                )}
              </div>
            )}
            {lead && (
              <div>
                <div className="text-blue-600 mb-1">Typical lead time</div>
                <div className="font-bold text-blue-900 text-base">
                  {lead.typical} days
                </div>
                <div className="text-blue-700 mt-1">
                  Range: {lead.min}-{lead.max} days
                </div>
              </div>
            )}
          </div>
          {moq && packMath?.unitsPerCarton && (
            <p className="text-xs text-blue-700 mt-3">
              Example: {moq.typical.toLocaleString()} units equals {Math.ceil(moq.typical / packMath.unitsPerCarton)} cartons at {packMath.unitsPerCarton} units per carton.
            </p>
          )}
        </div>
      )}

      {/* Evidence Numbers - Enhanced Display */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="text-xs font-semibold text-slate-700 mb-3">Estimate Basis</div>
        <div className="grid grid-cols-3 gap-4 text-xs mb-3">
          <div>
            <div className="text-slate-500 mb-1">Evidence source</div>
            <div className="font-bold text-slate-900 text-base">
              {estimate?.evidenceSource === "internal_records" 
                ? "Internal records" 
                : "Directional estimate"}
            </div>
            {estimate?.evidenceSource === "llm_baseline" && (
              <div className="text-xs text-amber-600 mt-1 font-medium">
                LLM baseline
              </div>
            )}
          </div>
          <div>
            <div className="text-slate-500 mb-1">Similar records</div>
            <div className="font-bold text-slate-900 text-base">
              {estimate?.similarRecordsCount ?? 0}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">Confidence</div>
            <div className={`font-bold text-base capitalize ${
              estimate?.confidenceTier === "high" ? "text-green-600" :
              estimate?.confidenceTier === "medium" ? "text-yellow-600" :
              "text-amber-600"
            }`}>
              {estimate?.confidenceTier ?? "low"}
            </div>
          </div>
        </div>
        {estimate?.evidenceSource === "llm_baseline" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
            <div className="font-medium text-amber-900 mb-1">
              No similar records found in internal database
            </div>
            <div className="text-amber-800">
              This estimate is based on LLM market knowledge. Accurate quotes can be obtained from verified suppliers within 24 hours.
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-600">
            Based on {estimate?.similarRecordsCount ?? 0} similar records.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Stat
          label="FOB price range"
          value={
            price
              ? `${price.min} to ${price.max} ${price.currency} ${price.unit}`
              : "N/A"
          }
        />
        {price && (
          <Stat
            label="Typical price (estimated)"
            value={`${((price.min + price.max) / 2).toFixed(2)} ${price.currency} ${price.unit}`}
          />
        )}
        <Stat
          label="MOQ range"
          value={
            moq ? `${moq.min} to ${moq.max} typical ${moq.typical}` : "N/A"
          }
        />
        <Stat
          label="Lead time"
          value={
            lead
              ? `${lead.min} to ${lead.max} days typical ${lead.typical}`
              : "N/A"
          }
        />
        <Stat
          label="Likely origins"
          value={countries.length ? countries.join(", ") : "N/A"}
        />
      </div>

      {hs.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-slate-800 mb-2">
            HS code candidates ranked by confidence. Final code depends on specs.
          </div>
          <div className="space-y-2 mb-4">
            {hs.slice(0, 3).map((x: any, idx: number) => (
              <div
                key={idx}
                className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3"
              >
                <div className="font-semibold">{x.code}</div>
                <div className="text-slate-600 mt-1">
                  confidence {Math.round((x.confidence ?? 0) * 100)} percent
                </div>
                {x.reason && (
                  <div className="text-slate-600 mt-1">{x.reason}</div>
                )}
              </div>
            ))}
          </div>
          
          {/* HS Code Decision Questions - Category aware */}
          {(() => {
            // Determine question set based on HS code candidates and category
            const topHsCode = hs.length > 0 ? hs[0].code : "";
            const isToyHs = topHsCode.startsWith("9503");
            const isFoodHs = topHsCode.startsWith("2106") || topHsCode.startsWith("2007");
            const isFoodCategory = estimate?.notes?.toLowerCase().includes("food") || 
              estimate?.notes?.toLowerCase().includes("confectionery") ||
              estimate?.notes?.toLowerCase().includes("pudding");
            const isToyCategory = estimate?.notes?.toLowerCase().includes("toy") ||
              estimate?.notes?.toLowerCase().includes("robotic") ||
              estimate?.notes?.toLowerCase().includes("dinosaur");
            const isMixedToyCandy = (isToyHs || isToyCategory) && estimate?.notes?.toLowerCase().includes("candy");
            
            // Show questions for toys or food, but not food questions for toys
            if (isToyHs || (isToyCategory && !isFoodCategory)) {
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-semibold text-blue-900">
                      Answer these to narrow down HS code
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Primary character:</strong> Is this sold mainly as a toy or mainly as candy?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Construction set:</strong> Does it include loose parts meant to be assembled into a model?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Age grading:</strong> What is the intended age on the box?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Materials:</strong> Plastic type, paint, magnets, batteries?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Small parts:</strong> Small parts and choking hazard labeling requirements?</span>
                    </div>
                    {isMixedToyCandy && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span><strong>Candy role:</strong> Is the candy incidental or a major part of the value?</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-3 italic">
                    Answering these questions will improve HS code confidence and precision.
                  </p>
                </div>
              );
            } else if (isFoodHs || isFoodCategory) {
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-semibold text-blue-900">
                      Answer these to narrow down HS code
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Fruit content:</strong> What percentage of fruit content and fruit juice?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Texture:</strong> Is it jelly, pudding, or gel? Is the gelling agent gelatin or agar?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Storage:</strong> Room temperature, refrigerated, or frozen?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Dairy:</strong> Does it contain any dairy products?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Composition:</strong> Sugar and additive composition details?</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-3 italic">
                    Answering these questions will improve HS code confidence and precision.
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Recent Import Activity (with fallback windows) - Always show section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Recent import activity
          </h3>
        </div>
        {recentImporters.length > 0 ? (
          <>
            <p className="text-xs text-slate-600 mb-4">
              {(() => {
                const windowDays = (estimate as any)?.recentImportersWindowDays ?? 90;
                if (windowDays === 90) {
                  return "Companies that imported similar products in the last 90 days.";
                } else if (windowDays === 180) {
                  return "최근 90일 관측 없음, 최근 180일 기준 top importers 표시";
                } else {
                  return "최근 90일 관측 없음, 최근 365일 기준 top importers 표시";
                }
              })()}
            </p>
            <div className="space-y-3">
              {recentImporters.map((importer, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm text-slate-900">
                      {importer.importerName}
                    </div>
                    <div className="text-xs text-slate-600">
                      {importer.shipmentCount} shipment{importer.shipmentCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    {importer.lastSeenDays !== 9999 && (
                      <span>
                        Last seen: {importer.lastSeenDays} day{importer.lastSeenDays !== 1 ? "s" : ""} ago
                      </span>
                    )}
                    {importer.topOrigins && importer.topOrigins.length > 0 && (
                      <span>
                        Origins: {importer.topOrigins.join(", ")}
                      </span>
                    )}
                  </div>
                  {importer.evidenceSnippet && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-600 italic">
                        "{importer.evidenceSnippet}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600">
            최근 365일 기준 관측된 수입자 없음
          </p>
        )}
      </div>

      {/* Observed Suppliers Section - Show when internal_records */}
      {estimate?.evidenceSource === "internal_records" && 
       (estimate?.similarRecordsCount ?? 0) > 0 && 
       estimate?.observedSuppliers && 
       estimate.observedSuppliers.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Observed suppliers in internal records
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            These exporters were found in similar import records. They may be able to produce this product.
          </p>
          <div className="space-y-3">
            {estimate.observedSuppliers.slice(0, 5).map((supplier, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm text-slate-900">
                    {supplier.exporterName}
                  </div>
                  <div className="text-xs text-slate-600">
                    {supplier.recordCount} record{supplier.recordCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  {supplier.lastSeenDays !== null && (
                    <span>
                      Last seen: {supplier.lastSeenDays} day{supplier.lastSeenDays !== 1 ? "s" : ""} ago
                    </span>
                  )}
                </div>
                {supplier.evidenceSnippet && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 italic">
                      "{supplier.evidenceSnippet}"
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Evidence source: shipping record</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-slate-800 mb-2">
            Use this list to avoid delays and surprise costs.
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
            {risks.slice(0, 8).map((r: string, idx: number) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {estimate?.notes && (
        <div className="mt-6 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
          {estimate.notes}
        </div>
      )}
    </motion.div>
  );
}

function EmptySuppliers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="text-center py-8">
        <Factory className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No matching suppliers found</p>
      </div>
    </motion.div>
  );
}

function SupplierCard({ supplier, index, onRequestQuote }: { supplier: SupplierMatch; index: number; onRequestQuote?: () => void }) {
  const rowKey = `${supplier.importKeyId ?? "noimport"}|${supplier.supplierId ?? "nosupplier"}|${supplier.productName ?? "noprod"}|${index}`;
  
  // Placeholder detection: treat 0, 1, and suspicious defaults as Unknown/Quote needed
  const isPlaceholderPrice = supplier.unitPrice <= 0 || supplier.unitPrice === 1;
  const isPlaceholderMoq = supplier.moq <= 1;
  const isPlaceholderLeadTime = supplier.leadTime <= 0;
  
  const unitPriceLabel = isPlaceholderPrice ? "Quote needed" : `$${supplier.unitPrice.toFixed(2)}`;
  const moqLabel = isPlaceholderMoq ? "Unknown" : supplier.moq.toLocaleString();
  const leadTimeLabel = isPlaceholderLeadTime ? "Unknown" : `${supplier.leadTime} days`;
  
  // Calculate recency (use lastSeenDays if available, otherwise calculate from date)
  const getRecency = (lastSeenDays: number | null | undefined, dateStr: string | null | undefined): string => {
    if (lastSeenDays !== null && lastSeenDays !== undefined) {
      if (lastSeenDays < 30) return "Recent";
      if (lastSeenDays < 90) return `${lastSeenDays} days ago`;
      if (lastSeenDays < 365) return `${Math.floor(lastSeenDays / 30)} months ago`;
      return `${Math.floor(lastSeenDays / 365)} years ago`;
    }
    if (!dateStr) return "Unknown";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 30) return "Recent";
      if (diffDays < 90) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "Unknown";
    }
  };
  
  const similarityScore = supplier.matchScore ?? 0;
  const recordCount = supplier.evidence?.recordCount ?? 0;
  const recency = getRecency(supplier.evidence?.lastSeenDays, supplier.evidence?.lastShipmentDate);
  
  const typeBadge = getSupplierTypeBadge(supplier.supplierType);
  const TypeIcon = typeBadge.icon;
  
  return (
    <motion.div
      key={rowKey}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
      className={`border rounded-2xl p-4 hover:shadow-md transition-all ${
        supplier.isInferred
          ? "border-yellow-300 bg-yellow-50/50"
          : "border-slate-200 hover:border-electric-blue-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-slate-900">
              {supplier.normalizedName || supplier.supplierName}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-slate-700">
                {supplier.matchScore}
              </span>
            </div>
          </div>
          
          {/* Supplier Type Badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center space-x-1 px-2 py-1 ${typeBadge.color} rounded-lg text-xs font-medium`}>
              <TypeIcon className="w-3 h-3" />
              <span>{typeBadge.label}</span>
            </span>
            
            {supplier.isInferred ? (
              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>AI Inferred</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                <CheckCircle2 className="w-3 h-3 fill-green-600" />
                <span>Perfect Match</span>
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-600 mb-2">
            {compactEvidence(supplier.productName)}
          </p>
          
          {/* Summary - Single unified summary block */}
          {supplier.summary && (
            <div className="mb-3">
              <div className="text-xs font-medium text-slate-700 mb-1">Summary</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {supplier.summary}
              </p>
            </div>
          )}
          
          {/* Evidence Details - Enhanced Display (Always Show) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
            <div className="text-xs font-semibold text-slate-700 mb-3">Evidence</div>
            {supplier.evidence && supplier.evidence.recordCount > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-1">Match score</div>
                    <div className="font-bold text-slate-900 text-base">{similarityScore}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Records</div>
                    <div className="font-bold text-slate-900 text-base">{recordCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Recency</div>
                    <div className="font-bold text-slate-900 text-base">{recency}</div>
                  </div>
                </div>
                {supplier.evidence.productTypes && supplier.evidence.productTypes.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-600">
                      <span className="font-medium">Common items:</span>{" "}
                      <span className="text-slate-900">
                        {supplier.evidence.productTypes.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Evidence Snippet */}
                {supplier.evidence?.evidenceSnippet && (
                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <div className="text-xs font-medium text-slate-700 mb-1">Evidence</div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{supplier.evidence.evidenceSnippet}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Limited shipping evidence. Verification required.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Unit price</p>
            <p className="text-sm font-semibold text-slate-900">
              {unitPriceLabel}
            </p>
            {isPlaceholderPrice && (
              <p className="text-xs text-slate-500 mt-1">
                Request a quote to confirm unit price, MOQ, and lead time.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">MOQ</p>
            <p className="text-sm font-semibold text-slate-900">
              {moqLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Lead Time</p>
            <p className="text-sm font-semibold text-slate-900">
              {leadTimeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <button
          onClick={onRequestQuote}
          className="w-full px-4 py-2 bg-electric-blue-600 text-white rounded-lg text-sm font-medium hover:bg-electric-blue-700 transition-colors"
        >
          Get quote in 24 hours
        </button>
      </div>
    </motion.div>
  );
}

export function SupplierList({ 
  suppliers, 
  recommendedSuppliers, 
  candidateSuppliers, 
  marketEstimate 
}: SupplierListProps) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierMatch | null>(null);

  // Backward compatibility: use suppliers if new props not provided
  // Recommended criteria: perfect match + evidence + factory/trading only
  const recommended = recommendedSuppliers ?? (suppliers?.filter(s => {
    const isPerfectMatch = !s.isInferred && (s.matchScore ?? 0) >= 50;
    const hasEvidence = (s.evidence?.recordCount ?? 0) >= 3; // Minimum 3 records
    const isFactoryOrTrading = s.supplierType === "factory" || s.supplierType === "trading";
    const isNotLogistics = s.supplierType !== "logistics";
    
    return isPerfectMatch && hasEvidence && isFactoryOrTrading && isNotLogistics;
  }) ?? []);
  
  const candidates = candidateSuppliers ?? (suppliers?.filter(s => {
    // Everything not in Recommended
    const isRecommended = recommended.some(r => r.supplierId === s.supplierId);
    return !isRecommended;
  }) ?? []);

  const handleRequestQuote = (supplier: SupplierMatch) => {
    setSelectedSupplier(supplier);
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = (data: any) => {
    // TODO: Send quote request to API
    console.log("Quote request:", { supplier: selectedSupplier, ...data });
    // Could integrate with ContactWidget WhatsApp flow
  };
  
  // Frontend safety filter
  const filterSuppliers = (list: SupplierMatch[]) => list.filter((s) => {
    const name = (s.supplierName ?? "").trim();
    if (!name || name.length === 0) return false;
    if (name.startsWith("|")) return false;
    if (name === "Unknown Supplier") return false;
    
    const n = name.toLowerCase();
    // Banned keywords check removed - logic moved to backend pipeline
    // We trust the pipeline's classification and filtering
    // Logistics companies are now allowed but classified as 'logistics' type
    
    if (n.includes("phone") || n.includes("email")) return false;
    
    return true;
  });
  
  // Deduplicate suppliers by normalizedName + country before filtering
  const deduplicateSuppliers = (list: SupplierMatch[]): SupplierMatch[] => {
    const seen = new Map<string, SupplierMatch>();
    
    list.forEach(supplier => {
      const key = `${(supplier.normalizedName || supplier.supplierName).toLowerCase()}_${(supplier.country || "").toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.set(key, supplier);
      } else {
        const existing = seen.get(key)!;
        // Keep the one with higher score, more recent lastSeen, or better evidence
        const existingScore = existing.matchScore ?? 0;
        const newScore = supplier.matchScore ?? 0;
        const existingLastSeen = existing.evidence?.lastSeenDays ?? Infinity;
        const newLastSeen = supplier.evidence?.lastSeenDays ?? Infinity;
        
        if (newScore > existingScore || 
            (newScore === existingScore && newLastSeen < existingLastSeen) ||
            (newScore === existingScore && newLastSeen === existingLastSeen && 
             (supplier.evidence?.recordCount ?? 0) > (existing.evidence?.recordCount ?? 0))) {
          // Merge evidence snippets if both have them
          if (existing.evidence?.evidenceSnippet && supplier.evidence?.evidenceSnippet) {
            const mergedSnippet = `${existing.evidence.evidenceSnippet} ${supplier.evidence.evidenceSnippet}`.slice(0, 120);
            supplier.evidence.evidenceSnippet = mergedSnippet;
          }
          seen.set(key, supplier);
        } else {
          // Merge evidence snippets into existing
          if (existing.evidence && supplier.evidence?.evidenceSnippet) {
            const mergedSnippet = `${existing.evidence.evidenceSnippet || ""} ${supplier.evidence.evidenceSnippet}`.slice(0, 120);
            existing.evidence.evidenceSnippet = mergedSnippet;
          }
        }
      }
    });
    
    return Array.from(seen.values());
  };
  
  const deduplicatedRecommended = deduplicateSuppliers(recommended);
  const deduplicatedCandidates = deduplicateSuppliers(candidates);
  
  const visibleRecommended = filterSuppliers(deduplicatedRecommended);
  const visibleCandidates = filterSuppliers(deduplicatedCandidates);
  
  const hasRecommended = visibleRecommended.length > 0;
  const hasCandidates = visibleCandidates.length > 0;
  const hasEstimate = !!marketEstimate;
  
  // Check if we need to show follow-up input (LLM baseline case)
  const needsFollowUpInput = marketEstimate && (
    marketEstimate.evidenceSource === "llm_baseline" || 
    (marketEstimate.similarRecordsCount ?? 0) === 0
  );
  
  // Categorize suppliers for food/confectionery products
  // Separate food manufacturers from packaging suppliers
  const isFoodCategory = marketEstimate?.notes?.toLowerCase().includes("food") || 
    marketEstimate?.notes?.toLowerCase().includes("confectionery") ||
    marketEstimate?.notes?.toLowerCase().includes("pudding") ||
    marketEstimate?.notes?.toLowerCase().includes("candy");
  
  const categorizeSuppliers = (supplierList: SupplierMatch[]) => {
    if (!isFoodCategory) return { foodManufacturers: [], packagingSuppliers: supplierList };
    
    const foodManufacturers: SupplierMatch[] = [];
    const packagingSuppliers: SupplierMatch[] = [];
    
    supplierList.forEach(supplier => {
      const name = (supplier.normalizedName || supplier.supplierName).toLowerCase();
      const productName = (supplier.productName || "").toLowerCase();
      
      // Check if it's likely a food manufacturer
      const foodKeywords = ["food", "confectionery", "snack", "beverage", "dairy", "bakery", "kitchen", "culinary"];
      const packagingKeywords = ["packaging", "container", "cup", "tray", "lid", "foil", "plastic", "box", "bag"];
      
      const hasFoodKeyword = foodKeywords.some(kw => name.includes(kw) || productName.includes(kw));
      const hasPackagingKeyword = packagingKeywords.some(kw => name.includes(kw) || productName.includes(kw));
      
      // If supplier type is factory and has food keywords, likely food manufacturer
      // If has packaging keywords but no food keywords, likely packaging supplier
      if (hasFoodKeyword && !hasPackagingKeyword) {
        foodManufacturers.push(supplier);
      } else if (hasPackagingKeyword || supplier.supplierType === "factory") {
        packagingSuppliers.push(supplier);
      } else {
        // Default: if unclear, put in packaging (safer assumption)
        packagingSuppliers.push(supplier);
      }
    });
    
    return { foodManufacturers, packagingSuppliers };
  };
  
  const { foodManufacturers, packagingSuppliers } = categorizeSuppliers(visibleCandidates);

  // Show recommended suppliers if available, or explain why there are none
  if (hasRecommended) {
    return (
      <div className="space-y-6">
        {/* Recommended Suppliers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-electric-blue-100 rounded-xl">
              <Star className="w-5 h-5 text-electric-blue-600 fill-electric-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Verified best matches
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                These are the closest matches with the strongest evidence.
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {visibleRecommended.length}
            </span>
          </div>

          <div className="space-y-4">
            {visibleRecommended.map((supplier, index) => (
              <SupplierCard 
                key={`recommended-${index}`} 
                supplier={supplier} 
                index={index}
                onRequestQuote={() => handleRequestQuote(supplier)}
              />
            ))}
          </div>
        </motion.div>

        {/* Candidate Suppliers Section (collapsible) */}
        {hasCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-white rounded-3xl shadow-sm p-6 border border-yellow-200"
          >
            <details className="group">
              <summary className="flex items-center space-x-3 mb-4 cursor-pointer list-none">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Other candidates
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 group-open:hidden">
                    {visibleCandidates.length} additional candidates available. These may fit but need verification.
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {visibleCandidates.length}
                </span>
                <span className="ml-auto text-sm text-slate-500 group-open:hidden">
                  Show candidates
                </span>
                <span className="ml-auto text-sm text-slate-500 hidden group-open:inline">
                  Hide candidates
                </span>
              </summary>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Verification Required
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      These suppliers are potential matches but require verification. Our team can verify and narrow down to <strong>3 confirmed suppliers within 24 hours</strong>.
                    </p>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
                      Request Verification (24h)
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {packagingSuppliers.map((supplier, index) => (
                  <SupplierCard 
                    key={`packaging-${index}`} 
                    supplier={supplier} 
                    index={index}
                    onRequestQuote={() => handleRequestQuote(supplier)}
                  />
                ))}
              </div>
            </details>
          </motion.div>
        )}
      </div>
    );
  }

  // Show explanation and market estimate if no recommended suppliers
  if (!hasRecommended) {
    return (
      <>
        {/* Explanation for why Recommended is 0 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                No exact product matches found in internal database
              </h3>
              <p className="text-sm text-blue-800">
                We searched for identical product text matches but found none. {hasCandidates ? "Similar category candidates are available below." : "Searching similar categories for candidates."} Below is a market baseline estimate.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Market Estimate */}
        {hasEstimate && <MarketEstimateCard estimate={marketEstimate} />}

        {/* Follow-up Input Card for LLM baseline cases */}
        {needsFollowUpInput && (
          <FollowUpInputCard
            productName={marketEstimate?.notes}
            category={undefined} // Could pass from analysis if available
            onInputSubmit={(data) => {
              // TODO: Save to /api/quote endpoint
              console.log("Follow-up input submitted:", data);
            }}
          />
        )}

        {/* Candidate Suppliers (if available) */}
        {hasCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-white rounded-3xl shadow-sm p-6 border border-yellow-200 mt-6"
          >
            <details className="group" open>
              <summary className="flex items-center space-x-3 mb-4 cursor-pointer list-none">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Other candidates
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 group-open:hidden">
                    {visibleCandidates.length} additional candidates available. These may fit but need verification.
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {visibleCandidates.length}
                </span>
                <span className="ml-auto text-sm text-slate-500 group-open:hidden">
                  Show candidates
                </span>
                <span className="ml-auto text-sm text-slate-500 hidden group-open:inline">
                  Hide candidates
                </span>
              </summary>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Verification Required
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      These suppliers are potential matches but require verification. Our team can verify and narrow down to <strong>3 confirmed suppliers within 24 hours</strong>.
                    </p>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
                      Request Verification (24h)
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {visibleCandidates.map((supplier, index) => (
                  <SupplierCard 
                    key={`candidate-${index}`} 
                    supplier={supplier} 
                    index={index}
                    onRequestQuote={() => handleRequestQuote(supplier)}
                  />
                ))}
              </div>
            </details>
          </motion.div>
        )}

        <QuoteModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          productName={marketEstimate?.notes || selectedSupplier?.productName}
          supplierName={selectedSupplier?.supplierName}
          onSubmit={handleQuoteSubmit}
        />
      </>
    );
  }

  return (
    <>
      <EmptySuppliers />
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={selectedSupplier?.productName}
        supplierName={selectedSupplier?.supplierName}
        onSubmit={handleQuoteSubmit}
      />
    </>
  );
}

