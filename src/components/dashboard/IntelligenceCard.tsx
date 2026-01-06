// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Brain, Hash, Tag, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import type { ImageAnalysisResult } from "@/lib/intelligence-pipeline";

interface IntelligenceCardProps {
  analysis: ImageAnalysisResult;
}

export function IntelligenceCard({ analysis: analysisInput }: IntelligenceCardProps) {
  const analysis = analysisInput as any;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-electric-blue-100 rounded-xl">
          <Brain className="w-5 h-5 text-electric-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Product Intelligence
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            What this product likely is and how we classify it.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Product Name */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Product name</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {analysis.productName}
          </p>
        </div>

        {/* HS Code */}
        {analysis.hsCode && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">HS code</span>
            </div>
            <p className="text-base font-mono text-electric-blue-600">
              {analysis.hsCode}
            </p>
          </div>
        )}

        {/* Category */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Category</span>
          </div>
          <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700 max-w-[180px] truncate" title={analysis.category}>
            {analysis.category}
          </span>
        </div>

        {/* Keywords */}
        {analysis.keywords.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Keywords</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[48px] overflow-hidden">
              {analysis.keywords.slice(0, 8).map((keyword: any, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-electric-blue-50 text-electric-blue-700 rounded-lg text-xs font-medium max-w-[90px] truncate"
                  title={keyword}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Price Range (Competitive Benchmarking) */}
        {analysis.estimatedUnitPriceRange && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-electric-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                Market Price Range (Competitive Benchmark)
              </span>
            </div>
            <div className="bg-electric-blue-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Low</span>
                <span className="text-xs text-slate-600">High</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-electric-blue-700">
                  ${analysis.estimatedUnitPriceRange.min.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-electric-blue-700">
                  ${analysis.estimatedUnitPriceRange.max.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Target price range for negotiation based on category analysis
              </p>
            </div>
          </div>
        )}

        {/* Market Insight (Risk Management) */}
        {analysis.marketInsight && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">
                Risk Management & Market Insight
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.marketInsight}
              </p>
            </div>
          </div>
        )}

        {/* Estimated HS Code */}
        {analysis.estimatedHsCode && !analysis.hsCode && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Estimated HS code
              </span>
            </div>
            <p className="text-base font-mono text-amber-600">
              {analysis.estimatedHsCode}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Used for duty and tariff checks. Final code is confirmed after supplier quote and product specs.
            </p>
          </div>
        )}

        {/* Confidence */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Confidence level</span>
            <span className="text-sm font-semibold text-slate-900">
              {(analysis.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.confidence * 100}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full bg-electric-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

