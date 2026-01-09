"use client";

import { CheckCircle2 } from "lucide-react";

const trustPoints = [
  "Conservative Estimates",
  "Risk Disclosure",
  "Actionable Next Steps",
];

export function TrustBar() {
  return (
    <section className="bg-white border-y border-slate-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {trustPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-medium text-slate-700">
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}














