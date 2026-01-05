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
      <div ref={ref} className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No hidden fees. Pay only when you see results.
            </p>
          </div>

          {/* Single Unified Pricing Card */}
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl border-2 border-blue-200 bg-white shadow-2xl overflow-hidden">
              {/* Free Credit Badge */}
              <div className="absolute top-6 right-6 z-10">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  FREE Monthly Credit
                </div>
              </div>

              <div className="p-8 sm:p-10 lg:p-12">
                {/* Pricing Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                  {/* Monthly Free Credit */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Monthly Free Credit</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-medium text-slate-400">$</span>
                      <span className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-none">45</span>
                    </div>
                    <p className="text-base text-slate-700 mb-2">
                      <span className="font-semibold text-emerald-700">1 FREE sourcing credit</span> every month
                    </p>
                    <p className="text-sm text-slate-500">
                      Use for Blueprint reports. Credits reset monthly.
                    </p>
                  </div>

                  {/* Execution Fee */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Execution Fee</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-none">7%</span>
                    </div>
                    <p className="text-base text-slate-700 mb-2">
                      <span className="font-semibold">Only when your order ships</span>
                    </p>
                    <p className="text-sm text-slate-500 mb-2">
                      Based on FOB value. Minimum fee $350 applies.
                    </p>
                    <p className="text-xs text-blue-700 bg-blue-50/80 border border-blue-200 rounded-lg px-3 py-2 leading-relaxed">
                      💡 <span className="font-semibold">Optimization Advantage:</span> Our optimization engine typically finds $3 - $5 more in per-unit savings than public Alibaba listings, more than covering our service fee.
                    </p>
                  </div>
                </div>

                {/* What's Included */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">What's included in your Blueprint:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">3 optimized factory quotes sourced via our proprietary intelligence network</span>
                        <span className="text-xs text-slate-500">MOQ and lead times included</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">HS Code & tariff analysis</span>
                        <span className="text-xs text-slate-500">Product-specific customs duty</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">Compliance checklist</span>
                        <span className="text-xs text-slate-500">Beginner-friendly import guide</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">Logistics execution plan</span>
                        <span className="text-xs text-slate-500">FOB to door roadmap</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section - Bottom of Pricing Card */}
          <div className="mt-10">
            <div className="flex flex-col items-center gap-4">
              <a
                href="/analyze"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start verification
              </a>
              <Link
                href="/sample-report/v2"
                className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Sample AI Analysis
              </Link>
              <p className="text-sm text-slate-500 text-center max-w-md">
                $45 is fully credited toward your first order within 60 days. Essentially free verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SectionVerifyPricing.displayName = "SectionVerifyPricing";

