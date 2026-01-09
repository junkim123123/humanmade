"use client"

import React from "react"
import { X, Check } from "lucide-react"
import { Logo } from "@/components/ui/Logo"

export default function WhyUsSection() {
  const diyRisks = [
    "Language Barriers",
    "No QC Guarantee",
    "Logistics Nightmares",
  ]

  const nexSupplyBenefits = [
    "On-the-Ground Team",
    "Total Logistics Handling",
    "Transparent 7% Fee",
  ]

  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
            Why NexSupply?
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Execution risk comparison: DIY vs. NexSupply
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* DIY / Alibaba */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-[16px] font-semibold text-slate-900 mb-4">
              DIY / Alibaba
            </h3>
            <ul className="space-y-3">
              {diyRisks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 mt-0.5">
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <span className="text-[14px] text-slate-700">{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* NexSupply */}
          <div className="rounded-xl border-2 border-slate-900 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Logo className="w-5 h-5" />
              <h3 className="text-[16px] font-semibold text-slate-900">
                NexSupply
              </h3>
            </div>
            <ul className="space-y-3">
              {nexSupplyBenefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[14px] text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

