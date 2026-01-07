"use client";

import * as React from "react";
import { forwardRef, useState } from "react";
import { SectionShell } from "./SectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideCard } from "@/components/ui/slide-card";
import { TitleBlock } from "./TitleBlock";
import { SlideBadge } from "@/components/ui/slide-badge";
import Link from "next/link";

interface SectionThreeStepsProps {
  isActive?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type StepKey = "upload" | "cost-range" | "verify";

interface StepData {
  key: StepKey;
  number: 1 | 2 | 3;
  title: string;
  description: string;
  timeBadge: string;
  outputs: string[];
  detail: {
    provide: string;
    get: string;
    reliable: string;
    preview: React.ReactNode;
    ctaText: string;
    ctaAction: () => void;
  };
}

const STEP_DATA: Record<StepKey, StepData> = {
  upload: {
    key: "upload",
    number: 1,
    title: "Upload",
    description: "Drop a product photo or paste a link. We extract category and key specs automatically using AI analysis.",
    timeBadge: "About 30 seconds",
    outputs: ["Category extracted", "Key specs inferred"],
    detail: {
      provide: "A product photo or product link",
      get: "Product name, category classification, and key specifications extracted from the image",
      reliable: "Powered by our AI for accurate product recognition and classification",
      preview: (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Product name</span>
            <span className="font-semibold text-slate-900">Plastic toy set</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Category</span>
            <SlideBadge variant="neutral">Toys & Games</SlideBadge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Confidence</span>
            <span className="font-medium text-slate-900">High</span>
          </div>
        </div>
      ),
      ctaText: "Start with a photo",
      ctaAction: () => {
        const uploadSection = document.getElementById("upload");
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
  },
  "cost-range": {
    key: "cost-range",
    number: 2,
    title: "Cost range",
    description: "We return a delivered cost range based on category signals, customs records, and shipping model calculations.",
    timeBadge: "In minutes",
    outputs: ["Delivered cost range", "Duty assumptions labeled"],
    detail: {
      provide: "Product category and basic specs from step 1",
      get: "A conservative and standard cost range showing factory price, shipping, duty, and fees breakdown",
      reliable: "Based on real US customs records when available, or market signals from similar products",
      preview: (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Standard range</span>
            <span className="font-semibold text-slate-900">Range $2.20–$2.66</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Factory price</span>
            <span className="font-medium text-slate-900">$0.75</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Shipping</span>
            <span className="font-medium text-slate-900">$1.20</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Duty & fees</span>
            <span className="font-medium text-slate-900">$0.27</span>
          </div>
        </div>
      ),
      ctaText: "See an example estimate",
      ctaAction: () => {
        const baselineSection = document.getElementById("baseline");
        if (baselineSection) {
          baselineSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
  },
  verify: {
    key: "verify",
    number: 3,
    title: "Verify",
    description: "We confirm the numbers that matter with supplier quotes, MOQ, lead time, and compliance checks.",
    timeBadge: "About 1 week",
    outputs: ["Quote attached", "MOQ and lead time confirmed"],
    detail: {
      provide: "Your target quantity and any specific requirements",
      get: "Verified supplier quotes with confirmed MOQ, lead times, and compliance documentation",
      reliable: "Outreach starts within 12 hours and verified quotes arrive in about a week with supplier confirmations and documentation",
      preview: (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Quote received</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">MOQ: 2,000 units</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Lead time: 45 days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Compliance checked</span>
          </div>
        </div>
      ),
      ctaText: "Verify with suppliers",
      ctaAction: () => {
        const verifySection = document.getElementById("verify");
        if (verifySection) {
          verifySection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
  },
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function StepSelector({
  activeStep,
  onStepChange,
}: {
  activeStep: StepKey;
  onStepChange: (step: StepKey) => void;
}) {
  const steps: Array<{ key: StepKey; label: string }> = [
    { key: "upload", label: "Upload" },
    { key: "cost-range", label: "Cost range" },
    { key: "verify", label: "Verify" },
  ];

  return (
    <div className="inline-flex items-center h-9 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <button
            type="button"
            onClick={() => onStepChange(step.key)}
            aria-pressed={activeStep === step.key}
            className={cx(
              "h-8 px-4 text-xs font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:ring-offset-2",
              activeStep === step.key
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {step.label}
          </button>
          {idx !== steps.length - 1 ? (
            <div className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StepCard({
  step,
  active,
  onClick,
}: {
  step: StepData;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border bg-white shadow-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:ring-offset-2",
        active
          ? "border-slate-300 ring-4 ring-slate-100 bg-slate-50/50"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="p-8 max-[900px]:p-6 max-[820px]:p-5">
        {/* Step number and time badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm tabular-nums">
            {step.number}
          </div>
          <Badge
            variant="outline"
            className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
          >
            {step.timeBadge}
          </Badge>
        </div>

        {/* Title */}
        <div className="text-base font-semibold text-slate-900 mb-1.5">
          {step.title}
        </div>

        {/* Description - clamp to 2 lines */}
        <div className="text-sm leading-snug text-slate-600 mb-3 line-clamp-2">
          {step.description}
        </div>

        {/* Outputs - limit to 2 visible, hide second in short heights */}
        <div className="flex flex-wrap gap-1.5">
          {step.outputs.slice(0, 1).map((output) => (
            <Chip key={output}>{output}</Chip>
          ))}
          {step.outputs.slice(1, 2).map((output) => (
            <span key={output} className="max-[820px]:hidden">
              <Chip>{output}</Chip>
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ step }: { step: StepData }) {
  return (
    <SlideCard className="mt-4 p-4">
      <div className="space-y-3">
        {/* What you get - summary */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1.5">
            What you get
          </div>
          <div className="text-xs text-slate-700 line-clamp-1">{step.detail.get}</div>
        </div>

        {/* Key outputs - max 2 bullets */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1.5">
            Key outputs
          </div>
          <ul className="space-y-1">
            {step.outputs.slice(0, 2).map((output, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-xs text-slate-700"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <span>{output}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="pt-1">
          <Button
            onClick={step.detail.ctaAction}
            size="sm"
            className="w-full sm:w-auto"
          >
            {step.detail.ctaText}
          </Button>
        </div>
      </div>
    </SlideCard>
  );
}

export const SectionThreeSteps = forwardRef<
  HTMLElement,
  SectionThreeStepsProps
>(({ isActive = false }, ref) => {
  const [activeStep, setActiveStep] = useState<StepKey>("upload");

  const title = "How it works";
  const subcopy =
    "Get a cost range in minutes. Verify only when you are ready to reorder.";

  const badges = [
    "Upload a photo or link",
    "Market range baseline",
    "Verified quotes in about a week",
  ];

  const steps = [
    STEP_DATA.upload,
    STEP_DATA["cost-range"],
    STEP_DATA.verify,
  ];

  return (
    <SectionShell
      ref={ref}
      index={4}
      contentAlign="center"
      density="default"
      budgets={{
        titleBlock: 160,
        controlRow: 52,
        mainContent: 420,
        detailPanel: 140,
      }}
      className="!py-0 !pt-8 lg:!pt-10 max-[900px]:!pt-8 max-[820px]:!pt-7"
    >
      <div className="slot-main-content">
        <div className="mx-auto max-w-6xl px-6 w-full py-3 max-[900px]:py-2 max-[820px]:py-1.5">
          <div className="mb-6 max-[900px]:mb-5 max-[820px]:mb-4">
            <div className="flex flex-col items-center text-center">
              <TitleBlock
                eyebrow="HOW IT WORKS"
                title={title}
                subtitle={subcopy}
                badges={
                  <>
                    {badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="outline"
                        className="h-5 px-2.5 text-xs bg-slate-50 text-slate-600 border-slate-200"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </>
                }
                density="default"
              />
            </div>
          </div>

          <div className="flex justify-center mb-6 max-[900px]:mb-5 max-[820px]:mb-4">
            <StepSelector
              activeStep={activeStep}
              onStepChange={setActiveStep}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-[900px]:gap-6 max-[820px]:gap-5 mb-6 max-[900px]:mb-5 max-[820px]:mb-4">
            {steps.map((step) => (
              <StepCard
                key={step.key}
                step={step}
                active={activeStep === step.key}
                onClick={() => setActiveStep(step.key)}
              />
            ))}
          </div>

          {/* Compact detail row - 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-[820px]:hidden">
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">What you get</div>
              <ul className="space-y-1">
                {(() => {
                  const getText = STEP_DATA[activeStep].detail.get;
                  // Show first part as one bullet, optionally split if there's a comma
                  const parts = getText.split(',').slice(0, 2).map(p => p.trim());
                  return parts.map((part, idx) => (
                    <li key={idx} className="text-sm text-slate-600 line-clamp-1">
                      {part}{idx < parts.length - 1 ? ',' : ''}
                    </li>
                  ));
                })()}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">Key outputs</div>
              <ul className="space-y-1">
                {STEP_DATA[activeStep].outputs.slice(0, 2).map((output, idx) => (
                  <li key={idx} className="text-sm text-slate-600 line-clamp-1">
                    {output}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">Next step</div>
              <div className="text-sm text-slate-600 line-clamp-1">
                {STEP_DATA[activeStep].detail.ctaText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
});

SectionThreeSteps.displayName = "SectionThreeSteps";
