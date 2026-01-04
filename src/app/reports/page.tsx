"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">리포트</h1>
          <p className="text-slate-600">생성된 리포트 목록</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockReports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}/v2`}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-electric-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-electric-blue-600" />
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    {report.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {report.productName}
              </h3>
              <div className="text-sm text-electric-blue-600 font-medium">
                리포트 보기 →
              </div>
            </Link>
          ))}
        </div>

        {mockReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">아직 생성된 리포트가 없습니다</p>
            <Link
              href="/analyze"
              className="inline-block px-6 py-3 bg-electric-blue-600 text-white rounded-lg hover:bg-electric-blue-700 transition-colors"
            >
              첫 분석 시작하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}














