"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ProductCard {
  id: string;
  name: string;
  image?: string;
  metric: string;
  category: string;
  colorClass?: string;
}

// Sample product data - can be replaced with real data later
const sampleProducts: ProductCard[] = [
  {
    id: "1",
    name: "Fruit Lover Marshmallow",
    metric: "Estimated $0.42 saved per unit",
    category: "Confectionery",
    colorClass: "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200",
  },
  {
    id: "2",
    name: "Plush Toy Collection",
    metric: "Lead time cut by 2 weeks",
    category: "Toys",
    colorClass: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
  },
  {
    id: "3",
    name: "Assorted Jelly Snacks",
    metric: "3 vetted quotes in 5 days",
    category: "Snacks",
    colorClass: "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
  },
];

interface ProofShowcaseProps {
  products?: ProductCard[];
}

export default function ProofShowcase({ products = sampleProducts }: ProofShowcaseProps) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Products we've sourced
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Real products, verified factories, and measurable cost savings.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`group rounded-xl border-2 p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
                product.colorClass || "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
              }`}
            >
              {/* Product Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white/50 backdrop-blur-sm mb-4 shadow-sm">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-slate-300/50"></div>
                      <div className="text-xs">Product image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Tag */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 backdrop-blur-sm text-slate-700 border border-slate-200/50">
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                {product.name}
              </h3>

              {/* Key Metric */}
              <p className="text-sm font-medium text-slate-700">
                {product.metric}
              </p>
            </div>
          ))}
        </div>

        {/* Proof CTA Section */}
        <div className="text-center pt-8 border-t border-slate-200">
          <Link
            href="/proof"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 hover:text-slate-700 transition-colors mb-3"
          >
            See all proof videos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Most proof packs include photos, checklists, and supplier documents.
          </p>
        </div>
      </div>
    </section>
  );
}

