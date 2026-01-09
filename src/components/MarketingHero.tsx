"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHero() {
  return (
    <section className="bg-gradient-to-br from-electric-blue-50 via-white to-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-electric-blue-100 text-electric-blue-700 rounded-full text-sm font-bold mb-6">
            <span>Trusted by St. Louis Retailers</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            Calculate Landed Costs
            <br />
            <span className="text-electric-blue-600">& Risks Instantly</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Start with a single photo. Get results including worst-case scenarios
            <br />
            and actionable next steps.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/reports/toy-example">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[200px] h-14 text-base font-semibold bg-electric-blue-600 hover:bg-electric-blue-700 shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Demo Report
              </Button>
            </Link>
            <Link href="/analyze">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto min-w-[200px] h-14 text-base font-semibold border-2 border-slate-300"
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}














