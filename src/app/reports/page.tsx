"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";
import { FileText, Calendar, ArrowRight, Plus } from "lucide-react";

// Mock reports list - TODO: Replace with actual API call
const mockReports = [
  {
    id: "toy-example",
    productName: "LINE FRIENDS Jelly Candy with Mini Figure",
    createdAt: "2025-01-15",
    category: "hybrid",
  },
  {
    id: "line-friends-jelly",
    productName: "LINE FRIENDS Jelly Candy with Mini Figure",
    createdAt: "2025-01-14",
    category: "hybrid",
  },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PrimaryNav />
      <div className="container mx-auto px-5 sm:px-6 lg:px-24 py-12 sm:py-16 lg:py-20 max-w-7xl">
        {/* Header Section */}
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-3 tracking-tight">
            리포트
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl">
            생성된 소싱 리포트를 확인하고 관리하세요
          </p>
        </div>

        {/* Reports Grid */}
        {mockReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {mockReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}/v2`}
                className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-electric-blue-600" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {report.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}</span>
                  </div>
                </div>

                {/* Product Name */}
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 line-clamp-2 leading-snug">
                  {report.productName}
                </h3>

                {/* Action Link */}
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-electric-blue-600 group-hover:text-electric-blue-700 transition-colors">
                  <span>리포트 보기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}

            {/* New Report Card */}
            <Link
              href="/analyze"
              className="group relative bg-slate-50 rounded-2xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-electric-blue-400 hover:bg-slate-100 transition-all duration-200 flex flex-col items-center justify-center min-h-[240px] text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300 group-hover:border-electric-blue-400 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-electric-blue-600 transition-colors" />
              </div>
              <p className="text-base font-medium text-slate-700 group-hover:text-slate-900">
                새 리포트 생성
              </p>
              <p className="text-sm text-slate-500 mt-1">
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
    </div>
  );
}














