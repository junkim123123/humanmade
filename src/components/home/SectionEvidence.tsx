"use client"

import * as React from "react"
import { forwardRef, useState } from "react"
import { ChevronDown, CheckCircle, AlertCircle, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SectionEvidenceProps {
  isActive?: boolean
}

const proofStates = [
  {
    name: "Verified match",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    shortDesc: "Proof attached from customs or supplier",
    detail: "The number is locked to a verified source. Badge stays green.",
  },
  {
    name: "Assumption based",
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    shortDesc: "Labeled gaps with editable ranges",
    detail: "No match yet. Ranges show the fastest way to raise confidence.",
  },
  {
    name: "Needs more proof",
    icon: HelpCircle,
    color: "text-slate-500",
    bgColor: "bg-slate-100",
    shortDesc: "Upload barcode or label to tighten",
    detail: "Upload more photos; we keep last good numbers while we search again.",
  },
]

export const SectionEvidence = forwardRef<HTMLDivElement, SectionEvidenceProps>(
  ({ isActive: _isActive = false }, ref) => {
    const [openIndex, setOpenIndex] = useState<number>(-1)

    return (
      <div ref={ref} className="landing-container py-12 lg:py-16">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
            Proof rides along with the number
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Cost shows its source. Confidence updates as inputs change.
          </p>
        </div>

        {/* Compact grid of 3 proof states */}
        <div className="mt-8 max-w-3xl mx-auto grid grid-cols-1 gap-3 sm:grid-cols-3">
          {proofStates.map((state, idx) => (
            <div key={state.name} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Compact header - always visible */}
              <button
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${state.bgColor}`}>
                  <state.icon className={`h-4 w-4 ${state.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-900">{state.name}</h3>
                  <p className="text-[12px] text-slate-500 truncate">{state.shortDesc}</p>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`} 
                />
              </button>
              
              {/* Accordion detail */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === idx ? "max-h-32" : "max-h-0"
                }`}
              >
                <div className="px-4 pb-4 border-t border-slate-100">
                  <p className="pt-3 text-[13px] text-slate-600">{state.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

SectionEvidence.displayName = "SectionEvidence"
