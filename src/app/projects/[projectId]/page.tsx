"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PrimaryNav } from "@/components/PrimaryNav";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectSLA } from "@/components/projects/ProjectSLA";
import { ProjectRequiredInfo } from "@/components/projects/ProjectRequiredInfo";
import { ProjectExpectations } from "@/components/projects/ProjectExpectations";
import { ProjectSuccessBanner } from "@/components/projects/ProjectSuccessBanner";
import { ProjectActivityFeed } from "@/components/projects/ProjectActivityFeed";
import type { Project, ProjectRequiredInfo as ProjectRequiredInfoType, ProjectActivity } from "@/lib/projects/types";

function ProjectPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [productName, setProductName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  // Get focus key from query param
  const focusKey = searchParams.get("focus") as "label" | "upc" | "materials" | null;

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch project");
        }

        setProject(data.data);

        // Check if started query param is present
        if (searchParams.get("started") === "1") {
          setShowSuccessBanner(true);
          // Remove query param from URL without reload
          router.replace(`/app/orders/${projectId}`, { scroll: false });
        }

        // Fetch report to get product name
        try {
          const reportResponse = await fetch(`/api/reports/${data.data.reportId}`);
          const reportData = await reportResponse.json();
          if (reportData.success && reportData.report) {
            setProductName(reportData.report.productName);
          }
        } catch (err) {
          // If report fetch fails, continue without product name
          console.warn("Could not fetch report for product name:", err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId, searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PrimaryNav />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PrimaryNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Unable to load project
            </h1>
            <p className="text-slate-600 mb-6">{error || "Project not found"}</p>
            <button
              onClick={() => router.push("/app/orders")}
              className="px-6 py-2 bg-electric-blue-600 text-white rounded-lg hover:bg-electric-blue-700 transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRequiredInfoUpdate = async (
    updates: Partial<ProjectRequiredInfoType>,
    activityMessage?: string
  ) => {
    try {
      const body: any = { requiredInfo: updates };
      
      // Add activity if message provided
      if (activityMessage) {
        const newActivity: ProjectActivity = {
          id: `act_${projectId}_${Date.now()}_user`,
          type: "user_action",
          message: activityMessage,
          timestamp: new Date().toISOString(),
        };
        body.activities = [newActivity];
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update project");
      }

      // Update local state
      if (data.data) {
        setProject(data.data);
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <ProjectHeader project={project} productName={productName} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {showSuccessBanner && (
          <ProjectSuccessBanner
            depositAmount={project.depositAmount}
            onDismiss={() => setShowSuccessBanner(false)}
          />
        )}

        <ProjectTimeline project={project} />
        <ProjectSLA />
        {project.activities && project.activities.length > 0 && (
          <ProjectActivityFeed activities={project.activities || []} />
        )}
        <ProjectRequiredInfo 
          project={project} 
          onUpdate={handleRequiredInfoUpdate}
          focusKey={focusKey}
        />
        <ProjectExpectations />
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectPageContent />
    </Suspense>
  );
}

