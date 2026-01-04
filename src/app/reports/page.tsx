"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";
import { FileText, Calendar, ArrowRight, Plus, TrendingDown, Clock, CheckCircle } from "lucide-react";

// Mock reports list - TODO: Replace with actual API call
const mockReports = [
  {
    id: "toy-example",
    productName: "LINE FRIENDS Jelly Candy with Mini Figure",
    createdAt: "2025-01-15",
    category: "hybrid",
    savings: "$0.42",
    savingsUnit: "per unit",
  },
  {
    id: "line-friends-jelly",
    productName: "LINE FRIENDS Jelly Candy with Mini Figure",
    createdAt: "2025-01-14",
    category: "hybrid",
    savings: "2 weeks",
    savingsUnit: "lead time reduced",
  },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PrimaryNav />
      
      {/* Hero Section */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="landing-title text-slate-900 mb-4">
              Products we've sourced
            </h1>
            <p className="landing-subtitle text-center max-w-2xl mx-auto">
              Real products, verified factories, and measurable cost savings.
            </p>
          </div>
        </div>
      </section>

      {/* Reports Gallery Section */}
      <section className="landing-section-tight bg-white">
        <div className="landing-container">
          {mockReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {mockReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}/v2`}
                  className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 mb-5 flex items-center justify-center overflow-hidden">
                    <FileText className="w-16 h-16 text-slate-400" />
                  </div>

                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {report.category}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-4 line-clamp-2 leading-snug group-hover:text-slate-700 transition-colors">
                    {report.productName}
                  </h3>

                  {/* Benefit Badge */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      {report.savings.includes("$") ? (
                        <TrendingDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="text-slate-600">
                        {report.savings.includes("$") ? "Estimated" : ""} <span className="font-semibold text-slate-900">{report.savings}</span> {report.savingsUnit}
                      </span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Link>
              ))}

              {/* Create New Report Card */}
              <Link
                href="/analyze"
                className="group relative bg-slate-50 rounded-2xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100 transition-all duration-300 flex flex-col items-center justify-center min-h-[360px] text-center"
              >
                <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-300 group-hover:border-slate-400 group-hover:scale-110 transition-all flex items-center justify-center mb-4">
                  <Plus className="w-7 h-7 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
                <p className="text-lg font-semibold text-slate-700 group-hover:text-slate-900 mb-1">
                  새 리포트 생성
                </p>
                <p className="text-sm text-slate-500">
                  분석 시작하기
                </p>
              </Link>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 sm:py-24 lg:py-32">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
                  리포트가 없습니다
                </h2>
                <p className="text-base text-slate-600 mb-8">
                  첫 번째 소싱 리포트를 생성하여 시작하세요
                </p>
                <Link
                  href="/analyze"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5" />
                  <span>새 분석 시작하기</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {mockReports.length > 0 && (
        <section className="landing-section-tight bg-slate-50">
          <div className="landing-container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Ready to get real quotes?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Outreach starts within 12 hours. Deposit credited on first order.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/analyze"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-base"
                >
                  <Plus className="w-5 h-5" />
                  <span>Start verification</span>
                </Link>
                <Link
                  href="/sample-report"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors font-medium text-base"
                >
                  <span>View sample report</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}














