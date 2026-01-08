// @ts-nocheck
"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEvidenceLevel,
  getEvidenceLevelInfo,
  getEvidenceChips,
} from "@/lib/report/scoring";
import { getEvidenceCooldown, formatCooldownTime } from "@/lib/report/evidence";
import type { Report } from "@/lib/report/types";
import { Search, Info, RefreshCw, ArrowRight } from "lucide-react";
import { BASELINE_DISCLAIMER } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EvidenceBarProps {
  report: Report;
  onEvidenceUpdated?: (updatedReport: Report) => void;
}

export function EvidenceBar({ report, onEvidenceUpdated }: EvidenceBarProps) {
  const router = useRouter();
  const evidenceInfo = getEvidenceLevelInfo(report);
  const evidenceChips = getEvidenceChips(report);
  const evidenceLevel = getEvidenceLevel(report);
  const [isSearching, setIsSearching] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  // Check cooldown on mount and update
  useEffect(() => {
    const cooldown = getEvidenceCooldown(report, evidenceLevel);
    if (cooldown.onCooldown && cooldown.retryAfterSeconds) {
      setCooldownSeconds(cooldown.retryAfterSeconds);
      
      // Update countdown every second
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCooldownSeconds(null);
    }
  }, [report, evidenceLevel]);

  const handleButtonClick = async () => {
    const verificationStatus = report.signals?.verificationStatus ?? "none";

    if (verificationStatus !== "none") {
      // View project: redirect to orders page
      router.push(`/app/orders?reportId=${report.id}`);
      return;
    }

    if (evidenceLevel === "evidence") {
      // Request verified quotes: open verification modal (handled by parent)
      // For now, redirect to analyze page where they can start verification
      router.push(`/analyze?reportId=${report.id}`);
      return;
    }

    // Baseline: upgrade evidence
    if (cooldownSeconds !== null && cooldownSeconds > 0) return;

    setIsSearching(true);

    try {
      const response = await fetch(`/api/reports/${report.id}/evidence-upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 429) {
        // Cooldown
        toast.error(`Please wait ${formatCooldownTime(data.retryAfterSeconds)} before trying again`);
        setCooldownSeconds(data.retryAfterSeconds);
      } else if (!data.ok) {
        toast.error(data.error || "Failed to upgrade evidence");
      } else {
        // Success
        const updatedReport = data.report as Report;
        onEvidenceUpdated?.(updatedReport);
        
        if (updatedReport.baseline.evidence.items.length > 0) {
          toast.success("Evidence attached");
        } else {
          toast.info("No import evidence found. Baseline remains.");
        }
      }
    } catch (error) {
      console.error("[Evidence Upgrade] Error:", error);
      toast.error("Failed to upgrade evidence");
    } finally {
      setIsSearching(false);
    }
  };

  const verificationStatus = report.signals?.verificationStatus ?? "none";

  // Button label and action based on evidence level and verification status
  let buttonLabel = "";
  let buttonAction: "upgrade" | "request_verification" | "view_project" = "upgrade";

  if (verificationStatus !== "none") {
    // Verified state: show "View project" button
    buttonLabel = "View project";
    buttonAction = "view_project";
  } else if (evidenceLevel === "baseline") {
    // Baseline state: show "Upgrade evidence" button
    buttonLabel = "Upgrade evidence";
    buttonAction = "upgrade";
  } else if (evidenceLevel === "evidence") {
    // Evidence backed state: show "Request verified quotes" button
    buttonLabel = "Request verified quotes";
    buttonAction = "request_verification";
  }

  const isDisabled = isSearching || (cooldownSeconds !== null && cooldownSeconds > 0 && buttonAction === "upgrade");

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div>
              <div className="text-xs text-slate-500 mb-1">Evidence Level</div>
              <div className="flex items-center gap-2">
                <Badge className={evidenceInfo.color}>
                  {evidenceInfo.label}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Info className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        {evidenceLevel === "baseline" 
                          ? BASELINE_DISCLAIMER
                          : "Evidence level reflects how much external proof is attached. Verification upgrades to confirmed quotes."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-xs text-slate-500 mb-1">Evidence Sources</div>
            <div className="flex items-center gap-2 flex-wrap">
              {evidenceChips.map((chip, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-slate-50 text-slate-600"
                >
                  {chip}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cooldownSeconds !== null && cooldownSeconds > 0 && (
            <span className="text-xs text-slate-500">
              {formatCooldownTime(cooldownSeconds)} remaining
            </span>
          )}
          <Button
            onClick={handleButtonClick}
            disabled={isDisabled}
            variant={buttonAction === "view_project" ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-2 ${
              buttonAction === "view_project"
                ? "bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
                : ""
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Searching evidence
              </>
            ) : buttonAction === "view_project" ? (
              <>
                {buttonLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {buttonLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


