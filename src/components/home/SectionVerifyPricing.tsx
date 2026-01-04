"use client";

import * as React from "react";
import { forwardRef } from "react";
import Link from "next/link";

interface SectionVerifyPricingProps {
  isActive?: boolean;
}

export const SectionVerifyPricing = forwardRef<HTMLDivElement, SectionVerifyPricingProps>(
  ({ isActive = false }, ref) => {
    return (
      <div ref={ref} className="landing-container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
              Pricing & Terms
            </h2>
          </div>

          {/* Pricing Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Verification Deposit */}
            <div className="text-center mb-6">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-xl font-medium text-slate-400">$</span>
                <span className="text-[48px] sm:text-[56px] font-bold tracking-tight text-slate-900 leading-none">45</span>
              </div>
              <p className="mt-2 text-slate-500 text-[14px]">Blueprint Fee (Sourcing Deposit)</p>
              <p className="mt-1 text-slate-400 text-[12px]">Refundable on first order</p>
            </div>

            {/* Execution Fee */}
            <div className="text-center mb-6 pb-6 border-b border-slate-100">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-[32px] sm:text-[40px] font-bold tracking-tight text-slate-900 leading-none">10%</span>
              </div>
              <p className="mt-2 text-slate-500 text-[14px]">Execution Fee</p>
              <p className="mt-1 text-slate-400 text-[12px]">of Order Value for managing production and logistics</p>
            </div>
            
            {/* Divider */}
            <div className="my-6 h-px bg-slate-100" />
            
            {/* Deliverables - focused on what you get */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[14px] text-slate-700">3 vetted factory quotes with MOQ and lead time</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[14px] text-slate-700">Compliance checklist included</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[14px] text-slate-700">Execution plan delivered in about a week</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <a
                href="/analyze"
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-[14px] font-medium text-white transition-colors hover:bg-slate-800"
              >
                Start verification
              </a>
              <p className="text-[12px] text-slate-500">
                Blueprint Fee is refunded on your first order within 30 days
              </p>
            </div>
            
            {/* Secondary link */}
            <div className="mt-4 text-center">
              <Link
                href="/pricing#deposit"
                className="text-[12px] text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                Read what the deposit covers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SectionVerifyPricing.displayName = "SectionVerifyPricing";

