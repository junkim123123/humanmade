"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ProductItem } from "./ProductGallery";

interface ProductShowcaseProps {
  products: ProductItem[];
  maxItems?: number;
}

/**
 * Compact product showcase for the landing page.
 * Shows a subset of products with a link to see all.
 */
export function ProductShowcase({ products, maxItems = 8 }: ProductShowcaseProps) {
  const displayProducts = products.slice(0, maxItems);

  if (displayProducts.length === 0) return null;

  return (
    <div className="landing-container py-16 lg:py-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
            Verified Supply Success
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Real products. Real factories. Real results.
          </p>
        </div>

        {/* Compact grid */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {displayProducts.map((product) => (
            <div
              key={product.slug}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.displayName}
                  fill
                  sizes="(max-width: 640px) 25vw, 12.5vw"
                  className="object-cover"
                  loading="lazy"
                />
              )}
              {/* Hover tooltip */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <p className="w-full p-2 text-[11px] font-medium text-white text-center line-clamp-2">
                  {product.displayName}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Link to full gallery */}
        <div className="mt-8 text-center">
          <Link
            href="/proof#products"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            See all {products.length} products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
