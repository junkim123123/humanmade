"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export interface ProductShowcaseItem {
  slug: string;
  displayName: string;
  images: string[];
}

// Sanitize product names to remove IP-specific references
function sanitizeProductName(name: string): string {
  const ipPatterns = [
    { pattern: /pokemon/gi, replacement: "Licensed Character Fan (Auth Required)" },
    { pattern: /one piece/gi, replacement: "Anime Figure" },
    { pattern: /disney/gi, replacement: "Licensed Character Product (Auth Required)" },
    { pattern: /doraemon/gi, replacement: "Character Fan" },
    { pattern: /demon slayer/gi, replacement: "Anime Keyring" },
    { pattern: /chiikawa/gi, replacement: "Character Product" },
    { pattern: /crayon shin-chan/gi, replacement: "Character Product" },
    { pattern: /minions/gi, replacement: "Character Product" },
  ];

  let sanitized = name;
  for (const { pattern, replacement } of ipPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = replacement;
      break;
    }
  }

  return sanitized;
}

interface SectionProductShowcaseProps {
  products: ProductShowcaseItem[];
}

// Case study data with measurable outcomes
const caseStudies = [
  {
    image: "/products/sample-candy.jpg",
    category: "Confectionery",
    outcome: "Estimated $0.42 saved per unit",
    description: "Matched to import record. 3 quotes received.",
  },
  {
    image: "/products/sample-toy.jpg",
    category: "Toys",
    outcome: "Lead time cut by 2 weeks",
    description: "Matched to customs-verified supplier.",
  },
  {
    image: "/products/sample-snack.jpg",
    category: "Snacks",
    outcome: "3 vetted quotes in 5 days",
    description: "Full compliance checklist included.",
  },
];

/**
 * Case studies section showing measurable outcomes.
 */
export function SectionProductShowcase({ products }: SectionProductShowcaseProps) {
  // Filter out IP-specific products and sanitize names
  const sanitizedProducts = products
    .filter(product => {
      const lowerName = product.displayName.toLowerCase();
      // Keep generic products, filter out obvious IP products
      const ipKeywords = ['pokemon', 'one piece', 'disney', 'doraemon', 'demon slayer', 'chiikawa', 'shin-chan', 'minions'];
      return !ipKeywords.some(keyword => lowerName.includes(keyword));
    })
    .map(product => ({
      ...product,
      displayName: sanitizeProductName(product.displayName),
    }))
    .slice(0, 3);
  
  // Use actual product images if available, otherwise show case studies
  const displayProducts = sanitizedProducts.length >= 3 ? sanitizedProducts : [
    { slug: "p-1", displayName: "3D Jelly", images: [] },
    { slug: "p-2", displayName: "Plush Toys", images: [] },
    { slug: "p-3", displayName: "Assorted Jelly", images: [] },
  ];
  const hasRealProducts = sanitizedProducts.length >= 3;

  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
            Products we've sourced
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Real products. Measurable results.
          </p>
        </div>

        {/* Case study cards - 3 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {hasRealProducts ? (
            displayProducts.map((product, idx) => (
              <div
                key={product.slug}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-slate-100">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.displayName}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {caseStudies[idx]?.category || "Product"}
                  </span>
                  <p className="mt-1 text-[14px] font-semibold text-slate-900">
                    {caseStudies[idx]?.outcome || "Verified sourcing"}
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2">
                    {product.displayName}
                  </p>
                </div>
              </div>
            ))
          ) : (
            caseStudies.map((study, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Placeholder image */}
                <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                  <div className="text-[13px] text-slate-400">Product image</div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {study.category}
                  </span>
                  <p className="mt-1 text-[14px] font-semibold text-slate-900">
                    {study.outcome}
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2">
                    {study.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-[12px] text-slate-500 max-w-2xl mx-auto">
            We strictly comply with IP laws. Branded goods require official authorization.
          </p>
        </div>

        {/* Link to full gallery */}
        <div className="mt-4 text-center">
          <Link
            href="/proof#products"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            See all products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
