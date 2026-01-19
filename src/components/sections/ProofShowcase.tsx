"use client";

import Link from "next/link";
import { ArrowRight, Camera, FileText, ListChecks, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { FadeUp, StaggerContainer } from "@/components/animation/ScrollReveal";
import RetailerLogos from "@/components/marketing/RetailerLogos";
import type { ProofProduct } from "@/components/proof/proofData";
import type { ProofStats } from "@/lib/proof/loadProofStats";

interface ProofShowcaseProps {
  products: ProofProduct[];
  proofStats: ProofStats;
}

export default function ProofShowcase({ products, proofStats }: ProofShowcaseProps) {
  return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Retailer Logos Row */}
        <RetailerLogos className="mb-10" />
        {/* Header */}
        <FadeUp>
            <div className="text-center mb-16 lg:mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-5">
                Proof you can verify
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Photos, checklists, and supplier docs tied to every verified quote—so your plan is engineered, not guessed.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <Camera className="h-4 w-4 text-slate-500" />
                  {proofStats.packsCount.toLocaleString()} proof packs
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <Camera className="h-4 w-4 text-slate-500" />
                  {proofStats.photosCount.toLocaleString()} photos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <ListChecks className="h-4 w-4 text-slate-500" />
                  QC checklists
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Supplier docs
                </span>
              </div>
            </div>
        </FadeUp>

        {/* Proof Packs Grid (real previews) */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {products.map((product, index) => (
            <FadeUp key={product.id} delay={index * 0.06}>
              <Link href="/proof" className="block">
                <motion.div
                  className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-slate-500">{product.category}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {product.photosCount} photos
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {product.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </FadeUp>
          ))}
        </StaggerContainer>

        {/* Proof CTA Section */}
        <FadeUp>
          <div className="text-center pt-12">
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Analyze my sourcing (Free)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Browse proof library
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-3">
              <Link
                href="/proof#videos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Watch proof videos
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500 max-w-xl mx-auto">
              Previews only. Full packs are shared with IP authorization; sensitive details are redacted.
            </p>
          </div>
        </FadeUp>
      </div>
  );
}

