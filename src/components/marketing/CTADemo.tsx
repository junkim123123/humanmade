"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface CTADemoProps {
  isActive: boolean;
}

const PROJECT_STEPS = [
  "Factory coordination and quality control",
  "Order management and tracking",
  "Payment processing and documentation",
];

export function CTADemo({ isActive }: CTADemoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left card: Start a project */}
        <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Start a project
          </h3>
          <div className="space-y-3 mb-6">
            {PROJECT_STEPS.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{step}</span>
              </motion.div>
            ))}
          </div>
          <div className="space-y-3">
            <Button
              asChild
              size="lg"
              className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
            >
              <Link href="/analyze">Start verification</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-slate-300"
            >
              <Link href="/app/orders">
                View orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Right card: Try demo */}
        <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Try demo
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            See how it works with a real example. Sign in when you want to run your own estimate.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-slate-300"
          >
            <Link href="/reports/toy-example">Open demo report</Link>
          </Button>
        </Card>
      </div>
    </motion.div>
  );
}

