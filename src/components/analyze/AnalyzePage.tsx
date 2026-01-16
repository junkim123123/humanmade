"use client";

import { AnalyzeForm, type AnalyzeFormMode } from "@/components/analyze/AnalyzeForm";

interface AnalyzePageProps {
  mode: AnalyzeFormMode;
}

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:26px_26px] opacity-60" />
      {/* Hero Section - Compact */}
      <div className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
                Analyze (Free)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Follow the guided workflow to build a verified supply chain report.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Vault Card */}
      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <AnalyzeForm mode={mode} />
      </div>
    </div>
  );
}
