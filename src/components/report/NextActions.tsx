// @ts-nocheck
"use client";

import { Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";

interface NextActionsProps {
  report: Report;
  onContactMatch?: () => void;
  onFactoryRequest?: () => void;
}

export function NextActions({
  report,
  onContactMatch,
  onFactoryRequest,
}: NextActionsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Next Actions</h2>

      <div className="space-y-4 mb-6">
        {report.nextActions.map((action, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-electric-blue-100 flex items-center justify-center text-electric-blue-600 font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {action.estimatedTime}
                </div>
              </div>
              <p className="text-sm text-slate-600">{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onContactMatch}
          className="flex-1 bg-electric-blue-600 hover:bg-electric-blue-700"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Connect with Agent
        </Button>
        <Button
          onClick={onFactoryRequest}
          variant="outline"
          className="flex-1"
        >
          Request Factory Candidates
        </Button>
      </div>
    </div>
  );
}














