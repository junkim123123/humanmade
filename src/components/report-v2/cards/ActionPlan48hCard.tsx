"use client";

import { Calendar, Clock } from "lucide-react";

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
      </div>
    </div>
  );
}

