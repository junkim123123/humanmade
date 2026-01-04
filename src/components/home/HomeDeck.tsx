"use client"

import React, { useCallback, useEffect } from "react"

import Hero from "@/components/hero/Hero"
import StickyScroll from "@/components/sections/StickyScroll"
import MarginComparison from "@/components/sections/MarginComparison"
import ProofShowcase from "@/components/sections/ProofShowcase"
import { SectionEvidence } from "@/components/home/SectionEvidence"
import { SectionVerifyPricing } from "@/components/home/SectionVerifyPricing"
import { SectionFAQ } from "@/components/home/SectionFAQ"
import { ShelfPriceProvider } from "@/contexts/ShelfPriceContext"
import TrustSection from "@/components/marketing/TrustSection"
import WhyUsSection from "@/components/marketing/WhyUsSection"

function FinalCta() {
  return (
    <div className="landing-container py-10 lg:py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-slate-900 sm:text-[24px]">
              Ready to get real quotes?
            </h2>
            <p className="mt-2 text-[14px] text-slate-600">
              Outreach starts within 12 hours. Deposit credited on first order.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <a
              href="/analyze"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-[14px] font-medium text-white transition-colors hover:bg-slate-800"
            >
              Start verification
            </a>
            <a
              href="/sample-report/v2"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View sample report
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomeDeck() {
  const getHeaderOffset = () => {
    const header =
      (typeof document !== "undefined" && (document.querySelector("[data-site-header]") as HTMLElement | null)) ||
      (typeof document !== "undefined" && (document.querySelector("header") as HTMLElement | null))
    return header ? header.getBoundingClientRect().height : 0
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const jumpTo = useCallback((id: string, focusUpload?: boolean) => {
    const target = document.getElementById(id)
    if (!target) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth"
    const headerOffset = getHeaderOffset() + 8
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset

    window.scrollTo({ top, behavior })

    if (focusUpload) {
      const uploadEl = document.getElementById("control-room-upload") as HTMLElement | null
      if (uploadEl) uploadEl.focus({ preventScroll: true })
    }
  }, [])

  return (
    <ShelfPriceProvider>
      <div className="relative">
        <div className="landing-scroll-container">
          {/* 1. Hero */}
          <section
            id="hero"
            className="bg-white"
          >
            <Hero />
          </section>

          {/* 2. Sticky Scroll - How it works */}
          <section id="how-it-works" className="bg-white">
            <StickyScroll
              title="How it works"
              subtitle="From product photo to landed cost, then to your door."
              steps={[
                {
                  title: "Analyze (Free)",
                  description: "Upload a product photo. Our AI calculates your real landed cost and margin estimate in minutes.",
                  color: "blue",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* Upload Area Mockup */}
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-white/50 flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-blue-700">Upload product photo</p>
                        </div>
                      </div>
                      {/* Analysis Results */}
                      <div className="p-6 space-y-3">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="h-8 bg-blue-100 rounded w-24"></div>
                          <div className="h-8 bg-emerald-100 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Verify ($45)",
                  description: "Deposit $45 to start factory validation. We reach out to verified suppliers and confirm pricing, MOQ, and lead times.",
                  color: "purple",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* Verification Status */}
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-white border-4 border-purple-500 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-white/80 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-white/60 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                      {/* Supplier Details */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 h-16 bg-slate-50 rounded-lg"></div>
                          <div className="flex-1 h-16 bg-slate-50 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Execute (7%)",
                  description: "We handle production, quality control, and logistics. You pay 7% fee only when your order ships.",
                  color: "emerald",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* Shipping Status */}
                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <div className="space-y-4">
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
                              <span>Production</span>
                              <span>Shipping</span>
                            </div>
                            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }}></div>
                            </div>
                          </div>
                          {/* Shipping Card */}
                          <div className="bg-white rounded-lg p-4 border border-emerald-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
                              <div className="flex-1">
                                <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
                                <div className="h-2 bg-slate-200 rounded w-32"></div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Order Details */}
                      <div className="p-6 space-y-3 border-t border-slate-100">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        <div className="pt-2 flex items-center justify-between">
                          <div className="h-6 bg-slate-200 rounded w-20"></div>
                          <div className="h-8 bg-emerald-100 rounded w-28"></div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </section>

          {/* 3. Margin Comparison */}
          <section id="receipt-compare" className="bg-white">
            <MarginComparison />
          </section>

          {/* 4. Proof Showcase - Social proof */}
          <section id="products" className="bg-white">
            <ProofShowcase />
          </section>

          {/* Existing sections below */}
          <section id="evidence" className="bg-slate-50/40">
            <SectionEvidence />
          </section>

          <section id="why-us" className="bg-slate-50/40">
            <WhyUsSection />
          </section>

          <section id="verify-pricing" className="bg-slate-50/50">
            <SectionVerifyPricing />
          </section>

          <section id="faq" className="bg-white">
            <SectionFAQ />
          </section>

          <section
            id="final-cta"
            className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40"
          >
            <FinalCta />
          </section>
        </div>
      </div>
    </ShelfPriceProvider>
  )
}
