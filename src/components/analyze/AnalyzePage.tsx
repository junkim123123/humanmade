"use client";

import { AnalyzeForm, type AnalyzeFormMode } from "@/components/analyze/AnalyzeForm";

interface AnalyzePageProps {
  mode: AnalyzeFormMode;
}

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-3 sm:mb-4">
              Analyze your product
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-500 leading-relaxed">
              Upload a product photo to get your real landed cost and margin estimate in minutes. 
              Barcode and label photos are optional but recommended for accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <AnalyzeForm mode={mode} />
      </div>
    </div>
  );
}
