"use client";

import { AnalyzeForm, type AnalyzeFormMode } from "@/components/analyze/AnalyzeForm";

interface AnalyzePageProps {
  mode: AnalyzeFormMode;
}

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section - Compact */}
      <div className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
              Analyze your product
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Upload a product photo to get your real landed cost and margin estimate in minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnalyzeForm mode={mode} />
      </div>
    </div>
  );
}
