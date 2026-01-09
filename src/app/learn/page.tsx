"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import { BookOpen, FileText, Video, TrendingUp } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Learn</h1>
          <p className="text-slate-600">
            Insights, tips, trends, and sourcing case studies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {[
            { icon: FileText, title: "Freight Pulse", desc: "Weekly freight summaries" },
            { icon: TrendingUp, title: "Tariff Alarm", desc: "Key tariff issues to watch" },
            { icon: Video, title: "Behind the Scenes", desc: "On-site operation videos" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-electric-blue-300 transition-all"
              >
                <Icon className="w-8 h-8 text-electric-blue-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Content coming soon</p>
        </div>
      </div>
    </div>
  );
}














