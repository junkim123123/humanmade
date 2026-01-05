"use client";

import { Calendar, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface ActionPlan48hCardProps {
  actionPlan: {
    today: string[];
    tomorrow: string[];
  };
}

export default function ActionPlan48hCard({ actionPlan }: ActionPlan48hCardProps) {
  const { today, tomorrow } = actionPlan;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-900">Next 48 hours</h3>
        <p className="text-[13px] text-slate-500 mt-1">Action plan to move forward</p>
      </div>
      
      <div className="px-6 py-5 space-y-6">
        {/* Today */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h4 className="text-[14px] font-semibold text-slate-900">Today</h4>
          </div>
          <ul className="space-y-2">
            {today.length > 0 ? (
              today.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-[13px] text-slate-500 italic">No actions scheduled</li>
            )}
          </ul>
        </div>
        
        {/* Tomorrow */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-600" />
            <h4 className="text-[14px] font-semibold text-slate-900">Tomorrow</h4>
          </div>
          <ul className="space-y-2">
            {tomorrow.length > 0 ? (
              tomorrow.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-[13px] text-slate-500 italic">No actions scheduled</li>
            )}
          </ul>
        </div>
        
        {/* Blueprint Sample Preview */}
        <div className="pt-6 border-t border-slate-100">
          <Link 
            href="/sample-report"
            className="group/blueprint block"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-blue-50/30 border border-purple-200/60 hover:border-purple-300 transition-colors">
              <div className="flex-shrink-0 w-16 h-20 rounded border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                {/* Sample Report Thumbnail - Mini Preview */}
                <div className="absolute inset-0 p-1.5">
                  <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded border border-slate-200/50 p-1">
                    <div className="space-y-0.5">
                      <div className="h-1 bg-purple-400 rounded w-3/4"></div>
                      <div className="h-0.5 bg-slate-300 rounded w-full"></div>
                      <div className="h-0.5 bg-emerald-400 rounded w-2/3 mt-1"></div>
                      <div className="h-0.5 bg-slate-300 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
                <FileText className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span className="text-[12px] font-semibold text-purple-900">Sample Blueprint Report</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed group-hover/blueprint:text-slate-700 transition-colors">
                  See what you'll receive after verification: 3 optimized factory quotes, HS Code analysis, compliance checklist, and logistics plan.
                </p>
                <span className="inline-block mt-1.5 text-[10px] font-medium text-purple-700 group-hover/blueprint:text-purple-800 transition-colors">
                  View sample →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

