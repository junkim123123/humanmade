"use client";

import { AnalyzeForm, type AnalyzeFormMode } from "@/components/analyze/AnalyzeForm";

interface AnalyzePageProps {
  mode: AnalyzeFormMode;
}

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section - Compact */}
      <div className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
                Analyze (Free)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Upload a product photo to get your real landed cost and margin estimate in minutes.
              </p>
            </div>
            {/* Optional: Add a progress indicator or step count here if needed */}
          </div>
        </div>
      </div>

      {/* Main Content - Dashboard Layout */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
           <AnalyzeForm mode={mode} />
        </div>
      </div>
    </div>
  );
}
