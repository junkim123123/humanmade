// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface BlockingCardProps {
  report: Report;
  onTightenClick: () => void;
}

/**
 * What is blocking confidence card
 * Shows why confidence is low and what actions can improve it
 */
export function BlockingCard({ report, onTightenClick }: BlockingCardProps) {
  const reportAny = report as any;
  const hasLandedCosts = reportAny._hasLandedCosts || false;
  const removalReasons = reportAny._removalReasons || null;
  
  // Build blockers list
  const blockers: Array<{ label: string; priority: number }> = [];
  
  if (!hasLandedCosts) {
    blockers.push({ label: "Quotes not collected yet", priority: 1 });
  }
  
  // Add removal reasons (top 2)
  if (removalReasons && typeof removalReasons === "object") {
    const entries = Object.entries(removalReasons)
      .filter(([_, count]) => typeof count === "number" && count > 0)
      .map(([reason, count]) => ({ reason, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    
    entries.forEach(({ reason, count }) => {
      const label = (() => {
        switch (reason) {
          case "logistics": return `${count} items removed due to logistics keywords`;
          case "badName": return `${count} items removed due to dummy IDs`;
          case "banned": return `${count} items removed due to banned keywords`;
          case "toyMismatch": return `${count} items removed due to category mismatch`;
          case "tooShort": return `${count} items removed due to short product names`;
          default: return `${reason}: ${count} items`;
        }
      })();
      blockers.push({ label, priority: blockers.length + 1 });
    });
  }
  
  // If no blockers found, show default
  if (blockers.length === 0) {
    blockers.push({ label: "Further verification recommended", priority: 1 });
  }

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            What is blocking confidence
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {blockers.map((blocker, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{blocker.label}</span>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onTightenClick}
        className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        Tighten inputs
      </Button>
    </Card>
  );
}

