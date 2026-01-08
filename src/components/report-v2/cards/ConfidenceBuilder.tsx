"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, UploadCloud, BarChart2 } from "lucide-react";
import { Report } from "@/lib/report/types";

interface ConfidenceBuilderProps {
  report: Report;
  onUpgrade: () => void;
}

const Feature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </div>
);

export default function ConfidenceBuilder({ report, onUpgrade }: ConfidenceBuilderProps) {
  // Calculate current margin if shelf price exists
  const reportAny = report as any;
  const targetSellPrice = reportAny.targetSellPrice || (reportAny._proof?.inputStatus?.shelfPrice) || 14.99;
  const costRange = report.baseline?.costRange;
  const currentUnitCost = costRange ? (
    (costRange.standard?.unitPrice || 0) +
    (costRange.standard?.shippingPerUnit || 0) +
    (costRange.standard?.dutyPerUnit || 0) +
    (costRange.standard?.feePerUnit || 0)
  ) : 0;

  const currentMargin = targetSellPrice && currentUnitCost > 0 
    ? Math.round(((targetSellPrice - currentUnitCost) / targetSellPrice) * 100) 
    : 28;
  
  const marginPotential = Math.round(currentMargin * 1.5); // Assume 50% improvement potential

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Unlock Your Full Profit Potential</h3>
        <p className="text-sm text-slate-600 mb-6">
          Your current margin is estimated at <span className="font-bold text-emerald-600">{currentMargin}%</span>. By providing more data, we can match you with our network of verified suppliers to potentially increase your margin to <span className="font-bold text-emerald-600">{marginPotential}%</span>.
        </p>

        <div className="space-y-5 mb-8">
          <Feature
            icon={<UploadCloud size={16} />}
            title="Upload Label & Barcode Photos"
            description="Confirming the product's origin and specifications allows for precise duty calculations and unlocks access to pre-vetted suppliers."
          />
          <Feature
            icon={<CheckCircle size={16} />}
            title="Guaranteed Factory Matching"
            description="Leverage our proprietary data to find factories that meet your quality, compliance, and cost requirements."
          />
          <Feature
            icon={<BarChart2 size={16} />}
            title="Actionable Cost-Saving Insights"
            description="Receive a detailed breakdown of your landed cost and a sensitivity analysis to understand what drives your profit."
          />
        </div>

        <motion.button
          onClick={onUpgrade}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>Start Verification ($49)</span>
          <ArrowRight size={18} />
        </motion.button>
      </div>
      <div className="bg-slate-50 p-4 text-center text-xs text-slate-500">
        <p>This one-time fee gives you access to our full network of verified suppliers and a dedicated sourcing agent.</p>
      </div>
    </div>
  );
}
