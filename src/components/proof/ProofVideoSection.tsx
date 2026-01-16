"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProofVideo, ProofVideoCategory } from "./proofData";
import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

type CategoryOption = {
  label: string;
  value: "All" | ProofVideoCategory;
};

interface ProofVideoSectionProps {
  title: string;
  subtitle: string;
  categories: CategoryOption[];
  videos: ProofVideo[];
  emptyMessage: string;
  openLabel: string;
}

export function ProofVideoSection({
  title,
  subtitle,
  categories,
  videos,
  emptyMessage,
  openLabel,
}: ProofVideoSectionProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryOption["value"]>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const filteredVideos = useMemo(() => {
    if (activeCategory === "All") return videos;
    return videos.filter((video) => video.category === activeCategory);
  }, [activeCategory, videos]);

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">{title}</h2>
          <p className="mt-2 text-[15px] text-slate-600">{subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={cn(
                "px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                activeCategory === category.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`video-skeleton-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 rounded-xl bg-slate-100 mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => window.open(video.href, "_blank", "noopener,noreferrer")}
                className="group text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
              >
                <div className="relative overflow-hidden rounded-t-2xl">
                  <div className="aspect-video bg-slate-100">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs font-semibold">{video.duration}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <PlayCircle className="w-4 h-4" />
                      {openLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-1">{video.title}</p>
                  <p className="text-xs text-slate-500">{video.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
