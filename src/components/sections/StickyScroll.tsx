"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Step {
  title: string;
  description: string;
  visual: React.ReactNode;
  color: string;
}

interface StickyScrollProps {
  steps: Step[];
  title?: string;
  subtitle?: string;
}

export default function StickyScroll({ steps, title, subtitle }: StickyScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate which step is active based on scroll progress
  const activeStep = useTransform(scrollYProgress, (progress) => {
    const stepProgress = progress * (steps.length - 1);
    return Math.min(Math.floor(stepProgress), steps.length - 1);
  });

  return (
    <section ref={containerRef} className="relative bg-white py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10 sm:mb-12 lg:mb-16 xl:mb-20">
            {title && (
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                {title}
              </p>
            )}
            {subtitle && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight px-2">
                {subtitle}
              </h2>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          {/* Left Column - Scrolling Steps - 60% height per step */}
          <div className="space-y-20 sm:space-y-28 lg:space-y-[60vh]">
            {steps.map((step, index) => {
              const stepRef = useRef<HTMLDivElement>(null);
              const stepProgress = useTransform(
                scrollYProgress,
                [index / steps.length, (index + 1) / steps.length],
                [0, 1]
              );

              const opacity = useTransform(stepProgress, [0, 0.15, 0.4, 0.6, 0.85, 1], [0.4, 0.8, 1, 1, 0.8, 0.4]);
              const y = useTransform(stepProgress, [0, 0.5, 1], [20, 0, -20]);

              return (
                <motion.div
                  key={index}
                  ref={stepRef}
                  style={{ opacity, y }}
                  className="relative"
                >
                  <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border ${
                    step.color === "blue" ? "bg-blue-50 border-blue-200" :
                    step.color === "purple" ? "bg-purple-50 border-purple-200" :
                    step.color === "emerald" ? "bg-emerald-50 border-emerald-200" :
                    "bg-slate-50 border-slate-200"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      step.color === "blue" ? "bg-blue-500" :
                      step.color === "purple" ? "bg-purple-500" :
                      step.color === "emerald" ? "bg-emerald-500" :
                      "bg-slate-500"
                    }`}></div>
                    <span className={`text-sm font-semibold ${
                      step.color === "blue" ? "text-blue-700" :
                      step.color === "purple" ? "text-purple-700" :
                      step.color === "emerald" ? "text-emerald-700" :
                      "text-slate-700"
                    }`}>
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column - Sticky Visual */}
          <div className="sticky top-20 sm:top-24 lg:top-32 h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[800px] mt-8 lg:mt-0">
            <div className="relative w-full h-full">
              {steps.map((step, index) => {
                const stepOpacity = useTransform(
                  activeStep,
                  (active) => (active === index ? 1 : 0)
                );
                const stepScale = useTransform(
                  activeStep,
                  (active) => (active === index ? 1 : 0.95)
                );

                return (
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      opacity: stepOpacity,
                      scale: stepScale,
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {step.visual}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

