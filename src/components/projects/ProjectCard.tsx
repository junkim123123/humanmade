// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEPOSIT_RECEIVED } from "@/lib/copy";
import type { Project } from "@/lib/types/project";
import { formatDistanceToNow } from "date-fns";
import { getProjectRecommendation } from "@/lib/projects/recommendation";

interface ProjectCardProps {
  project: Project;
  onCancel?: (id: string) => void;
}

export function ProjectCard({ project, onCancel }: ProjectCardProps) {
  const router = useRouter();

  const getStatusBadgeColor = (status: Project["status"]) => {
    switch (status) {
      case "requested":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "verifying":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "quoted":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getProgressPercentage = (status: Project["status"]) => {
    switch (status) {
      case "requested":
        return 10;
      case "verifying":
        return 60;
      case "quoted":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "requested":
        return "Requested";
      case "verifying":
        return "Verifying";
      case "quoted":
        return "Quoted";
      default:
        return status;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handlePrimaryAction = () => {
    if (project.status === "quoted") {
      // Route to report page with focus on verified section
      const reportId = project.reportId || "toy-example";
      router.push(`/reports/${reportId}/v2?focus=verified`);
    } else {
      // View details - route to order detail page
      router.push(`/app/orders/${project.id}`);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(project.id);
    }
  };

  return (
    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      {/* Top row: product name and status */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex-1">
          {project.productName}
        </h3>
        <Badge className={getStatusBadgeColor(project.status)}>
          {getStatusLabel(project.status)}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-electric-blue-600 transition-all duration-300"
            style={{ width: `${getProgressPercentage(project.status)}%` }}
          />
        </div>
      </div>

      {/* Latest activity preview - single line under progress bar */}
      {project.lastActivityAt && project.activities && project.activities.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs">
          <div className="flex-1 min-w-0 text-slate-600 truncate">
            {project.activities[project.activities.length - 1]?.message}
          </div>
          <div className="flex-shrink-0 text-slate-500">
            {formatDistanceToNow(new Date(project.lastActivityAt), { addSuffix: true })}
          </div>
        </div>
      )}

      {/* Next recommended action */}
      {(() => {
        const recommendation = getProjectRecommendation(project);
        if (!recommendation.key) return null;

        return (
          <div className="mb-6 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-slate-500">Next:</span>
              <span className="text-slate-700 truncate">{recommendation.title}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/app/orders/${project.id}?focus=${recommendation.key}`)}
              className="flex-shrink-0 border-electric-blue-300 text-electric-blue-700 hover:bg-electric-blue-50"
            >
              {recommendation.cta}
            </Button>
          </div>
        );
      })()}

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div className="text-slate-500 mb-1">Created</div>
          <div className="text-slate-900 font-medium">
            {formatDate(project.createdAt)}
          </div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Deposit</div>
          <div className="text-slate-900 font-medium">{DEPOSIT_RECEIVED}</div>
        </div>
      </div>

      {/* Quoted state extras */}
      {project.status === "quoted" && (
        <div className="mb-4 text-sm text-slate-600">
          {project.quotesSummary.suppliersCount} supplier options ready
        </div>
      )}

      {/* CTA row */}
      <div className="flex gap-3">
        <Button
          onClick={handlePrimaryAction}
          className="flex-1 bg-electric-blue-600 hover:bg-electric-blue-700"
        >
          {project.status === "quoted" ? "View quotes" : "View details"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          className="border-slate-300"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}

