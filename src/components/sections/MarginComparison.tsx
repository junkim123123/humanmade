"use client";

import { Check, X, Languages, Package, FileText, DollarSign } from "lucide-react";
import { CountUp } from "@/components/animation/CountUp";
import { FadeUp, StaggerContainer } from "@/components/animation/ScrollReveal";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { ProofStatusBadge } from "@/components/ui/ProofStatusBadge";

interface CostItem {
  label: string;
  amount: string;
  type?: "normal" | "total";
  proofStatus?: "verified" | "assumption" | "needs-proof";
}

interface ComparisonColumnProps {
  title: string;
  label: string;
  totalCost: string;
  items: CostItem[];
  isHighlight?: boolean;
  advantages?: Array<{ icon: React.ComponentType<{ className?: string }>; text: string }>;
}

function ComparisonColumn({
  title,
  label,
  totalCost,
  items,
  isHighlight = false,
  advantages = [],
}: ComparisonColumnProps) {
  return (
        <div
          className={`rounded-xl border-2 p-4 sm:p-6 lg:p-8 ${
            isHighlight
              ? "border-slate-900 bg-white shadow-lg"
              : "border-slate-200 bg-slate-50"
          }`}
        >
      {/* Label Chip */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            isHighlight
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-lg lg:text-xl font-bold mb-6 ${
          isHighlight ? "text-slate-900" : "text-slate-700"
        }`}
      >
        {title}
      </h3>

      {/* Big Total Cost */}
      <div className="mb-4 sm:mb-6">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-1">
          <CountUp from={0} to={parseFloat(totalCost.replace("$", ""))} decimals={2} prefix="$" />
        </div>
        <div className="text-xs sm:text-sm text-slate-500">Total Landed Cost</div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3 mb-6">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center justify-between py-2 ${
              index !== items.length - 1
                ? "border-b border-slate-200"
                : ""
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={`text-sm ${
                  item.type === "total"
                    ? "font-semibold text-slate-900"
                    : "text-slate-600"
                }`}
              >
                {item.label}
              </span>
              {item.proofStatus && (
                <ProofStatusBadge status={item.proofStatus} className="flex-shrink-0" />
              )}
            </div>
            <span
              className={`text-sm tabular-nums font-medium flex-shrink-0 ${
                item.type === "total"
                  ? "text-slate-900"
                  : "text-slate-700"
              }`}
            >
              {item.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Advantages/Pain Points */}
      {advantages && advantages.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <div className="space-y-3">
            {advantages.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  {isHighlight ? (
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isHighlight ? "text-slate-700" : "text-slate-600"}`}>
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarginComparison() {
  const diyItems: CostItem[] = [
    { label: "Alibaba sourcing", amount: "$3.50", proofStatus: "assumption" as const },
    { label: "Hidden fees & quality issues", amount: "+$2.00", proofStatus: "assumption" as const },
    { label: "Total cost", amount: "$5.50", type: "total", proofStatus: "assumption" as const },
  ];

  const nexSupplyItems: CostItem[] = [
    { label: "Factory FOB", amount: "$1.24", proofStatus: "verified" as const },
    { label: "Freight & duty", amount: "$0.86", proofStatus: "verified" as const },
    { label: "NexSupply fee (7%)", amount: "$0.09", proofStatus: "verified" as const },
    { label: "Total cost", amount: "$2.19", type: "total", proofStatus: "verified" as const },
  ];

  const diyPainPoints = [
    { icon: Languages, text: "Language barriers" },
    { icon: Package, text: "Quality lottery" },
    { icon: FileText, text: "Complex customs/logistics DIY" },
    { icon: DollarSign, text: "Hidden costs appear" },
  ];

  const nexSupplyAdvantages = [
    { icon: Languages, text: "Korean/English dedicated communication" },
    { icon: Package, text: "On-site QC team inspection" },
    { icon: FileText, text: "Door-to-door full service" },
    { icon: DollarSign, text: "Transparent 7% fixed fee" },
  ];

  return (
    <section className="bg-gradient-to-b from-slate-50 to-violet-50 py-16 sm:py-24 lg:py-32">
      <FadeUp>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-slate-900 mb-3 sm:mb-4 px-2">
              DIY vs NexSupply
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Compare self-sourcing on Alibaba vs our full-service factory direct sourcing.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-[600px] lg:min-w-0">
                {/* DIY Way */}
                <ComparisonColumn
                  title="DIY (Alibaba)"
                  label="Self-Sourcing"
                  totalCost="$5.50"
                  items={diyItems}
                  advantages={diyPainPoints}
                />

                {/* NexSupply Way */}
                <ComparisonColumn
                  title="NexSupply"
                  label="Full-Service"
                  totalCost="$2.19"
                  items={nexSupplyItems}
                  isHighlight={true}
                  advantages={nexSupplyAdvantages}
                />
              </StaggerContainer>
            </div>

            {/* Profit Unlocked Highlight */}
            <ProfitBadge />
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// Profit Badge with Scale Bounce Animation
function ProfitBadge() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 1.5,
      }}
      className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="text-sm font-medium text-slate-600 mb-1">
            Profit unlocked
          </div>
          <div className="text-3xl lg:text-4xl font-black text-emerald-600">
            <CountUp from={0} to={3.31} decimals={2} prefix="+$" suffix=" / unit" />
          </div>
        </div>
        <div className="text-sm text-slate-500 text-center sm:text-right">
          Based on example product pricing.
          <br />
          Actual savings vary by product.
        </div>
      </div>
    </motion.div>
  );
}

