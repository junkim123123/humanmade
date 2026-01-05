"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Candy, ToyBrick, Cookie } from "lucide-react";
import { motion } from "framer-motion";
import { FadeUp, StaggerContainer } from "@/components/animation/ScrollReveal";

interface ProductCard {
  id: string;
  name: string;
  image?: string;
  metric: string;
  category: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

// Real product examples with actual photos
const sampleProducts: ProductCard[] = [
  {
    id: "1",
    name: "Fruit Lover Marshmallow",
    metric: "Optimized sourcing via network intelligence",
    category: "Confectionery",
    colorClass: "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200",
    image: "/product-photos/과일먹은 마시멜로우/mmexport1758763658404.jpg",
    icon: <Candy className="w-16 h-16 text-rose-500" />,
  },
  {
    id: "2",
    name: "Demon Slayer Keychain",
    metric: "Data-driven factory matching",
    category: "Toys",
    colorClass: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
    image: "/product-photos/귀멸의 칼날 키링/mmexport1758763260109.jpg",
    icon: <ToyBrick className="w-16 h-16 text-blue-600" />,
  },
  {
    id: "3",
    name: "3D Jelly Snacks",
    metric: "Network-optimized quotes delivered",
    category: "Snacks",
    colorClass: "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
    image: "/product-photos/3d젤리/mmexport1758762843530.jpg",
    icon: <Cookie className="w-16 h-16 text-purple-600" />,
  },
];

interface ProofShowcaseProps {
  products?: ProductCard[];
}

export default function ProofShowcase({ products = sampleProducts }: ProofShowcaseProps) {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <FadeUp>
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Products we've sourced
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Real products, verified factories, and measurable cost savings.
            </p>
          </div>
        </FadeUp>

        {/* Product Cards Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mb-12">
          {products.map((product, index) => (
            <FadeUp key={product.id} delay={index * 0.1}>
              <motion.div
                className={`group relative rounded-2xl border-2 overflow-hidden p-6 h-[440px] ${
                  product.colorClass || "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
                }`}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Blurred Circle Gradient Background */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl"
                  style={{
                    background: product.colorClass?.includes("pink") ? "linear-gradient(135deg, #f472b6, #ec4899)" :
                               product.colorClass?.includes("blue") ? "linear-gradient(135deg, #60a5fa, #3b82f6)" :
                               "linear-gradient(135deg, #a78bfa, #8b5cf6)"
                  }}
                />
                
                {/* Product Visual Area - More compact */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-white/40 backdrop-blur-sm">
                  {product.image ? (
                    <img
                      src={product.image.split('/').map(segment => encodeURIComponent(segment)).join('/')}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* Blurred gradient background */}
                      <div className={`absolute inset-0 opacity-30 ${
                        product.colorClass?.includes("pink") ? "bg-gradient-to-br from-pink-200 to-rose-300" :
                        product.colorClass?.includes("blue") ? "bg-gradient-to-br from-blue-200 to-cyan-300" :
                        "bg-gradient-to-br from-purple-200 to-violet-300"
                      } blur-2xl`} />
                      {/* Category icon or letter - prefer icon if available */}
                      <div className={`relative ${
                        product.colorClass?.includes("pink") ? "text-rose-500" :
                        product.colorClass?.includes("blue") ? "text-blue-600" :
                        "text-purple-600"
                      }`}>
                        {product.icon ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.7 }}
                            transition={{ duration: 0.5 }}
                            className="drop-shadow-lg"
                          >
                            {product.icon}
                          </motion.div>
                        ) : (
                          <div className="text-7xl font-bold opacity-30">
                            {product.category.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Tag */}
                <div className="mb-3 relative z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200/50">
                    {product.category}
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 relative z-10">
                  {product.name}
                </h3>

                {/* Key Metric */}
                <p className="text-sm font-medium text-slate-500 relative z-10">
                  {product.metric}
                </p>
              </motion.div>
            </FadeUp>
          ))}
        </StaggerContainer>

        {/* Proof CTA Section */}
        <FadeUp>
          <div className="text-center pt-12 border-t border-slate-200">
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
        </FadeUp>
      </div>
    </section>
  );
}

