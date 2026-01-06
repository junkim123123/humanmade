"use client";

import * as React from "react";
import { forwardRef } from "react";
import { SectionShell } from "./SectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideCard } from "@/components/ui/slide-card";
import Link from "next/link";
import { TitleBlock } from "./TitleBlock";

interface SectionPricingProps {
  isActive?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface PlanData {
  label: string;
  title: string;
  priceMain: string;
  priceSub?: string;
  description: string;
  bullets: string[];
  bestFor: string;
  ctaText: string;
  ctaLink: string;
  recommended?: boolean;
}

const PLANS: PlanData[] = [
  {
    label: "FREE",
    title: "Cost range",
    priceMain: "$0",
    description: "Delivered cost range in minutes",
    bullets: ["Market range baseline", "Sign in to run and save"],
    bestFor: "First validation",
    ctaText: "Sign in to estimate",
    ctaLink: "/signin?next=%2Fapp%2Fanalyze",
  },
  {
    label: "VERIFICATION",
    title: "Verified quotes",
    priceMain: "$45",
    priceSub: "Per product",
    description: "At least 3 factory options with MOQ and lead time confirmed in about a week.",
    bullets: [
      "Outreach starts within 12 hours",
      "Updates while we validate quotes",
      "Execution plan and compliance checklist",
    ],
    bestFor: "Reorder ready numbers",
    ctaText: "Start verification",
    ctaLink: "/analyze",
    recommended: true,
  },
  {
    label: "ORDER",
    title: "Execution support",
    priceMain: "7% of FOB",
    priceSub: "Only when you place an order",
    description: "We manage production and logistics through arrival at your destination port.",
    bullets: [
      "Supplier coordination",
      "QC and inspection plan",
      "Production timeline tracking",
    ],
    bestFor: "Ongoing execution support",
    ctaText: "See execution fees",
    ctaLink: "/analyze",
  },
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0 text-slate-400"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 01.006 1.415l-7.25 7.32a1 1 0 01-1.422.002L3.29 9.29a1 1 0 011.414-1.414l3.05 3.05 6.54-6.6a1 1 0 011.41-.036z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PricingCard({ plan }: { plan: PlanData }) {
  return (
    <SlideCard
      className={cx(
        "h-full flex flex-col transition-all duration-300",
        plan.recommended
          ? "border-blue-200 ring-4 ring-blue-50 bg-white shadow-xl shadow-blue-500/10 scale-[1.02] z-10"
          : "border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
      )}
    >
      <div className="flex-1 space-y-5">
        {/* Header with label and recommended badge */}
        <div className="flex items-start justify-between gap-3">
          <div className={cx(
            "text-xs font-bold tracking-wider uppercase",
            plan.recommended ? "text-blue-600" : "text-slate-500"
          )}>
            {plan.label}
          </div>
          {plan.recommended ? (
            <Badge
              variant="outline"
              className="h-5 px-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold"
            >
              Recommended
            </Badge>
          ) : null}
        </div>

        {/* Title */}
        <div className="text-lg font-bold text-slate-900">
          {plan.title}
        </div>

        {/* Best for */}
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide bg-slate-50 inline-block px-2 py-1 rounded-md">
          Best for: {plan.bestFor}
        </div>

        {/* Price */}
        <div className="py-2">
          <div className={cx(
            "text-4xl font-bold tracking-tight tabular-nums",
            plan.recommended ? "text-slate-900" : "text-slate-700"
          )}>
            {plan.priceMain}
          </div>
          {plan.priceSub ? (
            <div className="mt-1.5 text-xs text-slate-500 font-medium tabular-nums">
              {plan.priceSub}
            </div>
          ) : null}
          {plan.label === "VERIFICATION" && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Credited on your order
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-slate-600">
          {plan.description}
        </p>

        {/* Bullets - limit to 3 */}
        {plan.bullets.length > 0 ? (
          <div className="space-y-3 pt-2">
            {plan.bullets.slice(0, 3).map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-sm text-slate-600"
              >
                <div className={cx(
                  "mt-0.5 shrink-0",
                  plan.recommended ? "text-blue-500" : "text-slate-400"
                )}>
                  <CheckIcon />
                </div>
                <span className="leading-5">{bullet}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* CTA Button - aligned at bottom */}
      <div className="pt-6 mt-auto border-t border-slate-100">
        <Link href={plan.ctaLink} className="block">
          <Button
            size="lg"
            variant={plan.recommended ? "default" : "outline"}
            className={cx(
              "w-full h-12 text-base shadow-sm transition-all active:scale-[0.98]",
              plan.recommended 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 font-bold" 
                : "hover:bg-slate-50 font-semibold text-slate-700"
            )}
          >
            {plan.ctaText}
          </Button>
        </Link>
      </div>
    </SlideCard>
  );
}

export const SectionPricing = forwardRef<HTMLElement, SectionPricingProps>(
  ({ isActive = false }, ref) => {
    return (
      <SectionShell
        ref={ref}
        index={7}
        contentAlign="center"
        density="default"
        budgets={{
          titleBlock: 150,
          mainContent: 460,
          footerNote: 56,
        }}
        className="!py-0"
      >
        <div className="w-full h-full flex flex-col">
          <div className="slot-title-block">
            <div className="flex flex-col items-center text-center">
              <TitleBlock
                eyebrow="PRICING"
                title="Pricing and verification"
                subtitle="Get a realistic delivered cost range in minutes. Verify only when you are ready to reorder."
                density="default"
              />
            </div>
          </div>

          <div className="slot-main-content flex-1 min-h-0 overflow-hidden">
            <div className="w-full px-6">
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
                {PLANS.map((plan) => (
                  <PricingCard key={plan.label} plan={plan} />
                ))}
              </div>
            </div>
          </div>

          <div className="slot-footer-note">
            <div className="w-full px-6">
              <SlideCard className="bg-slate-50/50 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-xs text-slate-600">
                  We attach US import records when we can match. Otherwise we
                  label assumptions.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
                  >
                    Import records refresh daily
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
                  >
                    Quotes in about a week
                  </Badge>
                </div>
              </div>
            </SlideCard>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }
);

SectionPricing.displayName = "SectionPricing";
