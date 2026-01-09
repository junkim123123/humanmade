"use client";

import { Upload, Brain, FileText } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Photo",
    description: "Upload just one photo of your product",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Auto-calculate HS codes, risks, and cost ranges",
  },
  {
    icon: FileText,
    title: "Generate Report",
    description: "Get detailed insights including worst-case scenarios and next steps",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Check your landed cost and risk in 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-blue-100 mb-4">
                  <Icon className="w-8 h-8 text-electric-blue-600" />
                </div>
                <div className="text-sm font-bold text-electric-blue-600 mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}














