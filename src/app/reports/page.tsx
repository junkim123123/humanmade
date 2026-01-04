"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import Link from "next/link";
import { Suspense } from "react";
import ProductCard3D from "@/components/reports/ProductCard3D";
import ProductIsometric from "@/components/reports/ProductIsometric";
import { ArrowRight, CheckCircle2 } from "lucide-react";

// Case study data matching Swell premium style
const caseStudies = [
  {
    id: "p-1",
    category: "Confectionery",
    productName: "Fruit Lover Marshmallow",
    benefit: "Estimated $0.42 saved per unit",
    gradientFrom: "from-rose-100/50",
    gradientTo: "to-pink-100/30",
    borderColor: "border-rose-200/60",
    categoryColor: "text-rose-600",
    bgColor: "bg-rose-50/40",
  },
  {
    id: "p-2",
    category: "Toys",
    productName: "Plush Toy Collection",
    benefit: "Lead time cut by 2 weeks",
    gradientFrom: "from-blue-100/50",
    gradientTo: "to-cyan-100/30",
    borderColor: "border-blue-200/60",
    categoryColor: "text-blue-600",
    bgColor: "bg-blue-50/40",
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
  },
];

// Stats for hero section
const stats = [
  { value: "150+", label: "Products Sourced" },
  { value: "$2.4M", label: "Total Savings" },
  { value: "98%", label: "Quality Score" },
];

function GlassCardLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
        <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-purple-300 rounded-full animate-[spin_0.8s_linear_reverse_infinite]" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <PrimaryNav />
      
      {/* Hero Section - Swell Style 2-Column Layout */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-cyan-50/20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
            
            {/* Right Column - Large 3D Illustration (Swell Style) */}
            <div className="relative h-[400px] lg:h-[500px] xl:h-[600px] w-full">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50/50 to-cyan-50/30 rounded-2xl">
                  <GlassCardLoader />
                </div>
              }>
                <div className="w-full h-full rounded-2xl overflow-hidden">
                  <ProductIsometric />
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      
      {/* Products Grid Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Swell Style */}
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Featured Case Studies
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Explore how we've helped brands optimize their supply chain with premium sourcing solutions.
            </p>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {caseStudies.map((study, index) => (
              <div
                key={study.id}
                className="group relative animate-fade-in"
              >
                {/* Glassmorphism Card */}
                <div
                  className={`
                    relative rounded-2xl overflow-hidden
                    bg-white/70 backdrop-blur-xl
                    border ${study.borderColor}
                    shadow-lg shadow-slate-200/50
                    transition-all duration-500 ease-out
                    hover:shadow-2xl hover:shadow-slate-300/50
                    hover:-translate-y-2 hover:scale-[1.02]
                    ${study.gradientFrom} ${study.gradientTo}
                    bg-gradient-to-br
                  `}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 ${study.gradientFrom} ${study.gradientTo} bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* 3D Product Illustration */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-white/80 to-slate-50/60">
                    <Suspense fallback={<GlassCardLoader />}>
                      <ProductCard3D category={study.category as "Confectionery" | "Toys" | "Snacks"} />
                    </Suspense>
                    
                    {/* Category Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full ${study.bgColor} backdrop-blur-sm border ${study.borderColor}`}>
                      <span className={`text-xs font-semibold ${study.categoryColor} uppercase tracking-wider`}>
                        {study.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                      {study.productName}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
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
                  
                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section - Swell Style */}
      <section className="relative py-24 lg:py-36">
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
      </section>
    </div>
  );
}














