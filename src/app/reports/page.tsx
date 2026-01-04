"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";

// Case study data matching NexSupply style
const caseStudies = [
  {
    id: "p-1",
    category: "Confectionery",
    productName: "Fruit Lover Marshmallow",
    benefit: "Estimated $0.42 saved per unit",
    borderColor: "border-pink-200",
  },
  {
    id: "p-2",
    category: "Toys",
    productName: "Plush Toy Collection",
    benefit: "Lead time cut by 2 weeks",
    borderColor: "border-blue-200",
  },
  {
    id: "p-3",
    category: "Snacks",
    productName: "Assorted Jelly Snacks",
    benefit: "3 vetted quotes in 5 days",
    borderColor: "border-purple-200",
  },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PrimaryNav />
      
      <div className="landing-container py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
              Products we've sourced
            </h2>
            <p className="mt-2 text-[15px] text-slate-600">
              Real products, verified factories, and measurable cost savings.
            </p>
          </div>

          {/* Case study cards - 3 columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {caseStudies.map((study) => (
              <div
                key={study.id}
                className={`rounded-xl border-2 ${study.borderColor} bg-white overflow-hidden`}
              >
                {/* Placeholder image */}
                <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                  <div className="text-[13px] text-slate-400">Product image</div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {study.category}
                  </span>
                  <p className="mt-1 text-[14px] font-semibold text-slate-900">
                    {study.productName}
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2">
                    {study.benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}














