"use client";

import * as React from "react";
import { forwardRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectionFAQProps {
  isActive?: boolean;
}

const faqs = [
  {
    q: "How accurate are AI estimates?",
    a: "Initial analysis uses market average data. At the $49 Blueprint stage, we refine estimates using actual invoices and customs data. All assumptions are clearly labeled.",
  },
  {
    q: "When is the $49 refunded?",
    a: "The $49 is credited (not refunded) toward your first order if you proceed within 60 days of receiving the Blueprint. It's essentially a free verification—you only pay if you actually order.",
  },
  {
    q: "What products can you source?",
    a: "We specialize in consumer goods (food, toys, general merchandise). Machinery or chemical products require separate consultation. Upload a photo to see if we can help.",
  },
  {
    q: "What's the difference between the free analysis and $49 Blueprint?",
    a: "Free analysis gives you AI-powered estimates. The $49 Blueprint includes real factory quotes, HS code verification, compliance review, and a detailed execution plan—everything you need to make a confident sourcing decision.",
  },
  {
    q: "What if I don't place an order after the Blueprint?",
    a: "You keep the Blueprint report with all factory quotes and analysis. The $49 is only credited if you place an order within 60 days—no obligation, no pressure.",
  },
];

export const SectionFAQ = forwardRef<HTMLDivElement, SectionFAQProps>(
  ({ isActive = false }, ref) => {
    // First item open by default
    const [openIndex, setOpenIndex] = useState<number>(0);

    return (
      <div ref={ref} className="landing-container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <h2 className="text-[28px] font-bold text-center text-slate-900 sm:text-[34px]" style={{ fontSize: '34px' }}>
            Questions
          </h2>

          {/* FAQ Accordion */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100" style={{ fontSize: '20px' }}>
            {faqs.map((faq, idx) => (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50 text-[20px] font-medium"
                  aria-expanded={openIndex === idx}
                >
                  <span className="text-[20px] font-semibold text-slate-900">{faq.q}</span>
                  <ChevronDown 
                    className={`h-6 w-6 shrink-0 text-slate-400 transition-transform ${
                      openIndex === idx ? "rotate-180" : ""
                    }`} 
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openIndex === idx ? "max-h-60" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-[18px] text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SectionFAQ.displayName = "SectionFAQ";
