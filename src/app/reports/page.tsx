"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Candy, ToyBrick, Cookie } from "lucide-react";
import { FadeUp, StaggerContainer } from "@/components/animation/ScrollReveal";
import { motion } from "framer-motion";
import { useState } from "react";

// Stats data for hero section
const stats = [
  {
    value: "Refined",
    label: "Data Precision",
  },
  {
    value: "$3-5",
    label: "Per-unit savings",
  },
  {
    value: "7%",
    label: "Service fee",
  },
];

// Case study data matching Swell premium style
const caseStudies = [
  {
    id: "sample-report/v2",
    category: "Confectionery",
    productName: "Fruit Gummies Variety Pack (12 count)",
    benefit: "Proof found 6 signals",
    gradientFrom: "from-rose-100/50",
    gradientTo: "to-pink-100/30",
    borderColor: "border-rose-200/60",
    categoryColor: "text-rose-600",
    bgColor: "bg-rose-50/40",
    image: "/product-photos/fruit-marshmallows/mmexport1758763658404.jpg",
    icon: Candy,
  },
  {
    id: "p-2",
    category: "Toys",
    productName: "Demon Slayer Keychain",
    benefit: "Data-driven factory matching",
    gradientFrom: "from-blue-100/50",
    gradientTo: "to-cyan-100/30",
    borderColor: "border-blue-200/60",
    categoryColor: "text-blue-600",
    bgColor: "bg-blue-50/40",
    image: "/product-photos/demon-slayer-keyring/mmexport1758763260109.jpg",
    icon: ToyBrick,
  },
  {
    id: "p-3",
    category: "Snacks",
    productName: "Assorted Jelly Snacks",
    benefit: "3 vetted quotes in 5 days",
    gradientFrom: "from-emerald-100/50",
    gradientTo: "to-green-100/30",
    borderColor: "border-emerald-200/60",
    categoryColor: "text-emerald-600",
    bgColor: "bg-emerald-50/40",
    image: "/product-photos/3d-jelly/mmexport1758762843530.jpg",
    icon: Cookie,
  },
];

// Product Image Component with proper error handling
function ProductImage({ 
  imagePath, 
  productName, 
  category,
  index,
  Icon
}: { 
  imagePath: string | undefined; 
  productName: string;
  category: string;
  index: number;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper to get fallback gradient colors
  const getCategoryColors = () => {
    if (category === "Confectionery") {
      return {
        gradient: "bg-gradient-to-br from-pink-400 to-rose-500",
        text: "text-rose-500"
      };
    } else if (category === "Toys") {
      return {
        gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
        text: "text-blue-600"
      };
    } else {
      return {
        gradient: "bg-gradient-to-br from-emerald-400 to-green-500",
        text: "text-green-500"
      };
    }
  };

  const colors = getCategoryColors();

  // Encode the image path for proper URL handling
  const getImageUrl = () => {
    if (!imagePath) return null;
    // Split path and encode each segment
    const segments = imagePath.split('/').filter(Boolean);
    const encodedSegments = segments.map(segment => encodeURIComponent(segment));
    return '/' + encodedSegments.join('/');
  };

  const imageUrl = getImageUrl();

  return (
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 rounded-t-2xl">
      {/* Fallback background - always rendered behind */}
      <div className={`absolute inset-0 flex items-center justify-center ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full opacity-30 blur-3xl ${colors.gradient}`} />
        {Icon ? (
          <Icon className={`w-24 h-24 ${colors.text} opacity-40 drop-shadow-lg`} />
        ) : (
          <div className={`text-8xl font-bold opacity-20 ${colors.text}`}>
            {category.charAt(0)}
          </div>
        )}
      </div>

      {/* Actual Product Image */}
      {imageUrl && !imageError && (
        <img
          src={imageUrl}
          alt={productName}
          className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={index < 3 ? "eager" : "lazy"}
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            setImageError(true);
          }}
          onLoad={() => {
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
}

// Simple Price Comparison Card (2D Fintech Style)
function PriceComparisonCard() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform-gpu [transform:rotateY(-8deg)_rotateX(3deg)] [transform-style:preserve-3d]">
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Price Comparison</h3>
          <p className="text-sm text-slate-500 mt-1">Per unit cost analysis</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Wholesale</p>
              <p className="text-sm text-slate-500">Traditional sourcing</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">$12.50</p>
              <p className="text-xs text-slate-500">per unit</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-slate-900">NexSupply</p>
                <p className="text-sm text-purple-600">Direct sourcing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">$8.30</p>
              <p className="text-xs text-purple-600 font-medium">per unit</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total Savings</span>
            <span className="text-lg font-bold text-emerald-600">33%</span>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <PrimaryNav />
      
      {/* Hero Section - Swell Style 2-Column Layout */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 pb-16 sm:pb-24 lg:pt-32 lg:pb-40">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-cyan-50/20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm mb-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">Verified Products</span>
              </div>
              
              {/* Main Title - Swell Style */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Products we've
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                  sourced
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-slate-600 mb-8 leading-relaxed">
                Real products, verified factories, and measurable cost savings.
                <br />
                <span className="text-lg text-slate-500 mt-2 block">
                  Trusted by leading brands worldwide.
                </span>
              </p>
              
              {/* Stats - Horizontal Layout */}
              <div className="flex flex-wrap gap-8 lg:gap-12 mt-12 pt-8 border-t border-slate-200/60">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-slate-600">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Floating UI Card (2D Fintech Style) */}
            <div className="relative h-[400px] lg:h-[500px] xl:h-[600px] w-full flex items-center justify-center">
              <PriceComparisonCard />
            </div>
          </div>
        </div>
      </section>
      
      {/* Products Grid Section */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Swell Style */}
          <FadeUp>
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                Featured Case Studies
              </h2>
              <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Explore how we've helped brands optimize their supply chain with premium sourcing solutions.
              </p>
            </div>
          </FadeUp>

          {/* Product Cards Grid */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {caseStudies.map((study, index) => (
              <FadeUp key={study.id} delay={index * 0.1}>
              <motion.div
                className="group relative"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Glassmorphism Card */}
                <div
                  className={`
                    relative rounded-2xl overflow-hidden
                    bg-white/70 backdrop-blur-xl
                    border ${study.borderColor}
                    shadow-lg shadow-slate-200/50
                    ${study.gradientFrom} ${study.gradientTo}
                    bg-gradient-to-br
                  `}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 ${study.gradientFrom} ${study.gradientTo} bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Product Visual - Actual Image */}
                  <ProductImage 
                    imagePath={study.image} 
                    productName={study.productName}
                    category={study.category}
                    index={index}
                    Icon={study.icon}
                  />
                    
                    {/* Category Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full ${study.bgColor} backdrop-blur-sm border ${study.borderColor} shadow-lg z-[3]`}>
                      <span className={`text-xs font-semibold ${study.categoryColor} uppercase tracking-wider`}>
                        {study.category}
                      </span>
                    </div>
                    
                    {/* Gradient Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-[2]" />
                  
                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-[4]" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                      {study.productName}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                      {study.benefit}
                    </p>
                    
                    {/* Action Link */}
                    <Link
                      href={`/reports/${study.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors group/link"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>
      
      {/* Trust Section */}
      <section className="relative py-16">
        <FadeUp>
          <div className="flex flex-col items-center justify-center space-y-8 py-12">
            {/* Header Section */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Trusted by SMB Sellers, Backed by Global Standards
              </h2>
              <p className="text-slate-500 text-lg">
                Access the same factory networks supplying vendors for:
              </p>
            </div>

            {/* Authority Logo Bar */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500 ease-in-out">
              {/* Costco Logo */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg" 
                alt="Costco Wholesale" 
                className="h-8 md:h-10 w-auto object-contain"
              />
              
              {/* 7-Eleven Logo */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/40/7-eleven_logo.svg" 
                alt="7-Eleven" 
                className="h-8 md:h-10 w-auto object-contain"
              />

              {/* Don Quijote Logo (Japanese Retail Giant) */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Don_Quijote_Logo.svg" 
                alt="Don Quijote" 
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>

            {/* Bridge Text */}
            <div className="w-full max-w-2xl border-t border-slate-200 pt-8 mt-4">
              <p className="text-center text-slate-600 font-medium">
                Real results from our St. Louis & Toronto community:
              </p>
            </div>
          </div>
        </FadeUp>
      </section>
      
      {/* CTA Section - Swell Style */}
      <section className="relative py-32">
        <FadeUp>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 p-12 lg:p-20 shadow-2xl shadow-purple-500/25">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Ready to optimize your supply chain?
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get started with a free analysis and see how much you can save.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 font-semibold text-lg rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>Start New Analysis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}














