import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Calendar, Clock, ArrowRight } from "lucide-react";
import { LiteYouTubeEmbed } from "@/components/marketing/LiteYouTubeEmbed";
import { proofVideos, getVideoBySlug, formatDuration } from "@/content/proofVideos";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return proofVideos.map((video) => ({
    slug: video.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  
  if (!video) {
    return { title: "Video Not Found | NexSupply" };
  }

  return {
    title: `${video.title} | Proof | NexSupply`,
    description: video.subtitle,
  };
}

export default async function ProofVideoPage({ params }: Props) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);

  if (!video) {
    notFound();
  }

  const publishedDate = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Back link */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/proof"
          className="inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all videos
        </Link>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Video embed */}
          <LiteYouTubeEmbed
            youtubeId={video.youtubeId}
            title={video.title}
          />

          {/* Video info */}
          <div className="mt-6">
            {/* Topic tag */}
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600 uppercase tracking-wide">
              {video.topic}
            </span>

            {/* Title */}
            <h1 className="mt-3 text-[24px] font-bold text-slate-900 sm:text-[28px]">
              {video.title}
            </h1>

            {/* Subtitle */}
            <p className="mt-2 text-[16px] text-slate-600">
              {video.subtitle}
            </p>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(video.durationSeconds)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {publishedDate ?? "Date TBD"}
              </span>
            </div>
          </div>

          {/* Takeaways */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
            <h2 className="text-[16px] font-semibold text-slate-900">Key Takeaways</h2>
            <ul className="mt-4 space-y-3">
              {video.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-[14px] text-slate-700">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transcript */}
          <div className="mt-8">
            <h2 className="text-[16px] font-semibold text-slate-900">Transcript</h2>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="prose prose-slate prose-sm max-w-none">
                {video.transcript.split("\n\n").map((paragraph, idx) => (
                  <p key={idx} className="text-[14px] text-slate-600 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Related links */}
          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-[16px] font-semibold text-slate-900">Ready to get started?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-slate-800"
              >
                Analyze a product
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reports/sample"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View sample report
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                See all proof videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
