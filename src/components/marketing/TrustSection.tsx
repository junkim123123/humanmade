"use client"

import React from "react"
import { Upload, Calculator, FileCheck } from "lucide-react"

const steps = [
  {
    icon: Upload,
    number: 1,
    title: "Analyze (Free)",
    desc: "Upload a photo. Our AI estimates the landed cost using real import data.",
    price: "Free",
  },
  {
    icon: Calculator,
    number: 2,
    title: "Verify ($49)",
    desc: "We validate the factory, negotiate MOQs, and confirm precise costs.",
    price: "$49",
  },
  {
    icon: FileCheck,
    number: 3,
    title: "Execute (Order)",
    desc: "We handle production, QC, and logistics. You just receive the goods.",
    price: "7% fee",
  },
]

const timeline = [
  { label: "Free analysis in 3 minutes" },
  { label: "Verification within 12 hours" },
  { label: "Execution on your order" },
]

export default function TrustSection() {
  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h2 className="text-[24px] font-bold text-center text-slate-900 sm:text-[28px]">
          How it works
        </h2>

        {/* Steps - 3 columns */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-[13px] font-semibold">
                    {step.number}
                  </div>
                  <step.icon className="h-5 w-5 text-slate-400" />
                </div>
                {step.price && (
                  <span className="text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {step.price}
                  </span>
                )}
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-[13px] text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Timeline row */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
