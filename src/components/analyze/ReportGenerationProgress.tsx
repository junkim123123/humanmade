"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

interface ReportGenerationProgressProps {
  currentStep: number;
  totalSteps: number;
  progress: number; // 0-100
  title?: string;
  description?: string;
  tip?: string;
}

export function ReportGenerationProgress({
  currentStep = 4,
  totalSteps = 4,
  progress = 100,
  title = "Generating insights",
  description = "Preparing your comprehensive sourcing report",
  tip = "We start outreach within 12 hours and share verified quotes in about a week.",
}: ReportGenerationProgressProps) {
  const progressPercentage = Math.min(100, Math.max(0, progress));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Visual */}
        <div className="flex flex-col items-center mb-12">
          {/* Icon Circle */}
          <div className="relative mb-8">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
            
            {/* Main circle */}
            <motion.div
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <TrendingUp className="w-12 h-12 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? "w-8 bg-emerald-500"
                    : index === currentStep
                    ? "w-8 bg-blue-500"
                    : "w-8 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-[24px] sm:text-[28px] font-bold text-slate-900">
                {title}
              </h2>
            </div>
            <p className="text-[15px] text-slate-600 max-w-md mx-auto">
              {description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between mb-2 text-[13px] text-slate-600">
              <span className="font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Tip Box */}
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="
              rounded-2xl border border-amber-200 bg-amber-50/90
              p-4 sm:p-5
              shadow-sm
            "
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-amber-700 text-[12px]">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-amber-900 mb-1">Tip</p>
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  {tip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

