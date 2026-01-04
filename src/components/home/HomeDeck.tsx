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
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                      <div className="space-y-4">
                        <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">📸</span>
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Verify ($45)",
                  description: "Deposit $45 to start factory validation. We reach out to verified suppliers and confirm pricing, MOQ, and lead times.",
                  color: "purple",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                      <div className="space-y-4">
                        <div className="h-32 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">✅</span>
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Execute (10%)",
                  description: "We handle production, quality control, and logistics. You pay 10% fee only when your order ships.",
                  color: "emerald",
                  visual: (
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                      <div className="space-y-4">
                        <div className="h-32 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">🚀</span>
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
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
