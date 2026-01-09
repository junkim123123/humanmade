// @ts-nocheck
"use client";

import { ProjectCard } from "./ProjectCard";
import { getProjects, saveProjects } from "@/lib/storage/projects";
import type { Project } from "@/lib/types/project";

interface ProjectListProps {
  onProjectUpdate?: () => void;
}

export function ProjectList({ onProjectUpdate }: ProjectListProps) {
  const projects = getProjects();

  const handleCancel = (id: string) => {
    // Remove project from localStorage
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
    if (onProjectUpdate) {
      onProjectUpdate();
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
        <p className="text-slate-600 mb-6">
          No active projects yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}

