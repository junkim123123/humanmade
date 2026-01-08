"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface VerificationDemoProps {
  isActive: boolean;
}

const TIMELINE = [
  {
    day: "Day 1",
    title: "Outreach started",
    description: "Contact 3 factories, verify exporter vs forwarder",
  },
  {
    day: "Day 2",
    title: "Collect details",
    description: "MOQ, lead time, samples, compliance checklist",
  },
  {
    day: "Day 3",
    title: "Confirmed quotes",
    description: "Verified quotes returned with compliance checklist",
  },
];

export function VerificationDemo({ isActive }: VerificationDemoProps) {
  return (
    <div className="w-full max-w-[900px] mx-auto mt-8">
      <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Timeline */}
          <div className="space-y-4">
            {TIMELINE.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: index * 0.15, duration: 0.3 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-electric-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-electric-blue-600">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {item.day}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: What you receive */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              What you receive
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>3 verified suppliers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Confirmed quotes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sample plan and compliance checklist</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA area (inside card, bottom) */}
        <div className="pt-6 mt-6 border-t border-slate-200">
          <Button
            asChild
            size="lg"
            className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
          >
            <Link href="/analyze">Start verification</Link>
          </Button>
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-600 mb-1">
              $49 deposit, credited if you place an order
            </p>
            <Link
              href="/pricing"
              className="text-xs text-electric-blue-600 hover:text-electric-blue-700 underline"
            >
              See pricing details
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

