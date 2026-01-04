"use client";

import { Check } from "lucide-react";
import { CountUp } from "@/components/animation/CountUp";
import { FadeUp, StaggerContainer } from "@/components/animation/ScrollReveal";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

interface CostItem {
  label: string;
  amount: string;
  type?: "normal" | "total";
}

interface ComparisonColumnProps {
  title: string;
  label: string;
  totalCost: string;
  items: CostItem[];
  isHighlight?: boolean;
  advantages?: string[];
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
      className={`rounded-xl border-2 p-6 lg:p-8 ${
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
      <div className="mb-6">
        <div className="text-4xl lg:text-5xl font-black text-slate-900 mb-1">
          <CountUp from={0} to={parseFloat(totalCost.replace("$", ""))} decimals={2} prefix="$" />
        </div>
        <div className="text-sm text-slate-500">total cost</div>
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
            <span
              className={`text-sm ${
                item.type === "total"
                  ? "font-semibold text-slate-900"
                  : "text-slate-600"
              }`}
            >
              {item.label}
            </span>
            <span
              className={`text-sm tabular-nums font-medium ${
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

      {/* Advantages (only for NexSupply) */}
      {isHighlight && advantages.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <div className="space-y-3">
            {advantages.map((advantage, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{advantage}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarginComparison() {
  const wholesaleItems: CostItem[] = [
    { label: "Wholesale price", amount: "$5.50" },
    { label: "Total cost", amount: "$5.50", type: "total" },
  ];

  const nexSupplyItems: CostItem[] = [
    { label: "Factory FOB", amount: "$1.24" },
    { label: "Freight & duty", amount: "$0.86" },
    { label: "NexSupply fee (10%)", amount: "$0.12" },
    { label: "Total cost", amount: "$2.22", type: "total" },
  ];

  const nexSupplyAdvantages = [
    "Flexible MOQs (no bulk minimums)",
    "Verified factories with quality control",
    "Compliance and customs support",
    "End-to-end logistics handling",
  ];

  return (
    <section className="bg-gradient-to-b from-slate-50 to-violet-50 py-16 lg:py-24">
      <FadeUp>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              See the margin gap
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Compare buying wholesale vs going direct with NexSupply execution support.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 lg:p-8">
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Current Way */}
              <ComparisonColumn
                title="Current way (buying wholesale)"
                label="Wholesale"
                totalCost="$5.50"
                items={wholesaleItems}
              />

              {/* NexSupply Way */}
              <ComparisonColumn
                title="NexSupply way (going direct)"
                label="NexSupply"
                totalCost="$2.22"
                items={nexSupplyItems}
                isHighlight={true}
                advantages={nexSupplyAdvantages}
              />
            </StaggerContainer>

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
      className="mt-8 pt-8 border-t border-slate-200"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="text-sm font-medium text-slate-600 mb-1">
            Profit unlocked
          </div>
          <div className="text-3xl lg:text-4xl font-black text-emerald-600">
            <CountUp from={0} to={3.28} decimals={2} prefix="+$" suffix=" / unit" />
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

