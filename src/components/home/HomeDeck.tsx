"use client"

import React, { useCallback, useEffect } from "react"

import Hero from "@/components/hero/Hero"
import StickyScroll from "@/components/sections/StickyScroll"
import MarginComparison from "@/components/sections/MarginComparison"
import ProofShowcase from "@/components/sections/ProofShowcase"
import { SectionVerifyPricing } from "@/components/home/SectionVerifyPricing"
import { SectionFAQ } from "@/components/home/SectionFAQ"
import { ShelfPriceProvider } from "@/contexts/ShelfPriceContext"
import TrustSection from "@/components/marketing/TrustSection"
import { AnnouncementBar } from "@/components/ui/AnnouncementBar"
import { ZoomBookingSection } from "@/components/sections/ZoomBookingSection"
import { LocalBadge } from "@/components/ui/LocalBadge"

function FinalCta() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden border-2 border-white/10">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Ready to out-source your competition?
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Let our OS engineer your optimal supply chain with proprietary intelligence and data-driven optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/analyze"
                className="inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base sm:text-lg font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Calculate My Savings (Free)
              </a>
              <a
                href="/reports"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm px-6 text-base sm:text-lg font-semibold text-white transition-all hover:bg-white/20 hover:border-white/30"
              >
                View Sample AI Reports
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              No credit card required • Results in minutes • Deposit credited on first order
            </p>
          </div>
        </div>
      </div>
    </section>
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
        {/* Top Announcement Bar */}
        <AnnouncementBar />
        
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
              subtitle="Photo to cost to door."
              steps={[
                {
                  title: "Analyze (Free)",
                  description: "Upload a product photo. Our AI calculates your real landed cost and margin estimate in minutes.",
                  color: "blue",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-blue-500/10 overflow-hidden">
                      {/* Upload Area Mockup */}
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-white shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                          {/* Animated background pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_20s_linear_infinite]"></div>
                          </div>
                          <div className="relative z-10 w-12 h-12 rounded-full bg-blue-100 shadow-md flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-blue-700 relative z-10">Upload product photo</p>
                        </div>
                      </div>
                      {/* Analysis Results */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="h-8 bg-blue-100 rounded w-24"></div>
                          <div className="h-8 bg-emerald-100 rounded w-32 flex items-center gap-1 px-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Blueprint ($45)",
                  description: "$45 is not just a deposit—it's a professional sourcing report purchase. Get 3 optimized factory quotes sourced via our proprietary intelligence network with MOQ & lead times, HS code & tariff analysis, compliance checklist for beginners, and door-to-door logistics execution plan.",
                  color: "purple",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* Blueprint Header */}
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-white border-4 border-purple-500 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-white/80 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-white/60 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                      {/* Blueprint Checklist */}
                      <div className="p-6 space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                              <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                              <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                              <div className="h-2 bg-slate-200 rounded w-3/5"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sample Report Download Button */}
                        <div className="pt-4 mt-4 border-t border-purple-100">
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View AI Analysis Sample
                          </button>
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
                        
                        {/* Trust Indicators */}
                        <div className="pt-4 mt-4 border-t border-emerald-100 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">QC photos provided</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-medium">Delivery guarantee</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </section>

          {/* 3. Margin Comparison */}
          <section id="receipt-compare" className="bg-white py-16 sm:py-24 lg:py-32">
            <MarginComparison />
          </section>

          {/* 4. Proof Showcase - Social proof */}
          <section id="products" className="bg-gradient-to-b from-white to-slate-50/40 py-16 sm:py-24 lg:py-32">
            <ProofShowcase />
          </section>

          {/* 5. Zoom Booking Section */}
          <section className="bg-gradient-to-b from-slate-50/40 to-white py-16 sm:py-24 lg:py-32">
            <ZoomBookingSection />
          </section>

          {/* Pricing Section */}
          <section id="verify-pricing" className="bg-gradient-to-b from-slate-50/30 to-white py-16 sm:py-24 lg:py-32">
            <SectionVerifyPricing />
          </section>

          <section id="faq" className="bg-white py-16 sm:py-24 lg:py-32">
            <SectionFAQ />
          </section>

          <section
            id="final-cta"
            className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 py-16 sm:py-24 lg:py-32"
          >
            <FinalCta />
          </section>

          {/* Local Badge */}
          <div className="py-8 flex justify-center">
            <LocalBadge />
          </div>
        </div>
      </div>
    </ShelfPriceProvider>
  )
}
