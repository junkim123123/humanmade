// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Upload, Package, Printer } from "lucide-react";
import type { Project } from "@/lib/projects/types";

interface ProjectNextActionsProps {
  project: Project;
}

const getActions = (targetMoq: number) => [
  {
    id: "back_label",
    label: "Upload back label photo",
    description: "If missing, upload product label for better precision",
    icon: Upload,
    completed: false,
  },
  {
    id: "confirm_moq",
    label: "Confirm target MOQ",
    description: `Current: ${targetMoq.toLocaleString()} units`,
    icon: Package,
    completed: false,
  },
  {
    id: "confirm_packaging",
    label: "Confirm printing and packaging",
    description: "Specify any special requirements",
    icon: Printer,
    completed: false,
  },
];

export function ProjectNextActions({ project }: ProjectNextActionsProps) {
  const [showAddInfo, setShowAddInfo] = useState(false);
  const actions = getActions(project.request.targetMoq);

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Next Actions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddInfo(!showAddInfo)}
        >
          {showAddInfo ? "Cancel" : "Add Info"}
        </Button>
      </div>

      {showAddInfo && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-4">
            This feature is coming soon. For now, please contact us directly with any additional information.
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li
              key={action.id}
              className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                action.completed
                  ? "bg-green-100 text-green-600"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {action.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  {action.label}
                </h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

