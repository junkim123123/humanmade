import Link from "next/link";
import Image from "next/image";
import { Play, Clock } from "lucide-react";
import { formatDuration, type ProofVideo } from "@/content/proofVideos";

interface VideoCardProps {
  video: ProofVideo;
}

/**
 * Card component for displaying a video in the grid.
 * Shows thumbnail, title, subtitle, duration, and topic.
 */
export function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <Link
      href={`/proof/${video.slug}`}
      className="
        group block overflow-hidden
        rounded-2xl border border-slate-200 bg-white/90
        shadow-[0_18px_45px_rgba(15,23,42,0.14)]
        transition-all hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)]
        hover:-translate-y-[2px]
      "
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <Image
          src={thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <Play className="h-5 w-5 text-slate-900 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
          <Clock className="h-3 w-3" />
          {formatDuration(video.durationSeconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Topic tag */}
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 uppercase tracking-wide">
          {video.topic}
        </span>

        {/* Title */}
        <h3 className="mt-2 text-[15px] font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </h3>

        {/* Subtitle */}
        <p className="mt-1 text-[13px] text-slate-500 line-clamp-2">
          {video.subtitle}
        </p>
      </div>
    </Link>
  );
}
