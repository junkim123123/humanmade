import { Metadata } from "next";
import { Check } from "lucide-react";
import { LiteYouTubeEmbed } from "@/components/marketing/LiteYouTubeEmbed";
import { VideoGrid } from "@/components/marketing/VideoGrid";
import { ProductGallery } from "@/components/marketing/ProductGallery";
import { proofVideos, getFeaturedVideo, formatDuration } from "@/content/proofVideos";
import { loadProductManifest } from "@/lib/productManifest";

export const metadata: Metadata = {
  title: "Proof | NexSupply",
  description: "Watch how we verify suppliers and costs in the field. Factory audits, customs data matching, and supplier outreach—all documented.",
};

export default function ProofPage() {
  const featuredVideo = getFeaturedVideo();
  const allVideos = proofVideos;
  const products = loadProductManifest();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-slate-100/80">
      {/* Hero / Start Here - 3D Card */}
      <section id="proof-hero" className="bg-slate-50/80 py-10 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div
            className="
              rounded-3xl border border-slate-200 bg-white/95
              shadow-[0_26px_70px_rgba(15,23,42,0.18)]
              backdrop-blur-sm px-6 py-7 sm:px-10 sm:py-9 text-center
            "
          >
            <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 mb-2">
              Proof in action
            </h1>
            <p className="text-[15px] text-slate-600 mb-4">
              See how we verify products and attach evidence to your numbers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-3">
              <a
                href="/verify"
                className="
                  inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2
                  text-[15px] font-medium text-white
                  shadow-[0_18px_45px_rgba(15,23,42,0.5)]
                  hover:bg-slate-800 hover:shadow-[0_22px_55px_rgba(15,23,42,0.6)]
                  transition-all
                "
              >
                Start verification
              </a>
              <a
                href="/analyze"
                className="
                  inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2
                  text-[15px] font-medium text-slate-900 border border-slate-200
                  hover:bg-slate-200 transition-colors
                "
              >
                Run an estimate
              </a>
            </div>
            <p className="text-[13px] text-slate-500">
              Most proof packs include photos, checklists, and supplier docs.
            </p>
          </div>
        </div>
      </section>

      {/* Proof in Action - All Videos */}
      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
              Proof in action
            </h2>
            <p className="mt-2 text-[15px] text-slate-600">
              Watch our verification process across different scenarios
            </p>
          </div>

          {/* Video grid */}
          <VideoGrid videos={allVideos} columns={3} />
        </div>
      </section>

      {/* Products Gallery */}
      {products.length > 0 && (
        <section id="products" className="bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-5">
            {/* Header with stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-900">
                Products we&apos;ve sourced
              </h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-700 border border-slate-200">
                {products.length} products from verified factories
              </span>
            </div>

            {/* 3D Board with Gallery */}
            <div
              className="
                rounded-3xl border border-slate-200 bg-white/95
                shadow-[0_26px_70px_rgba(15,23,42,0.18)]
                backdrop-blur-sm p-5 sm:p-6
              "
            >
              <ProductGallery products={products} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
