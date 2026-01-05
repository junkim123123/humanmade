"use client";

import { Calendar, MapPin, Gift, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function ZoomBookingSection() {
  return (
    <section id="zoom-booking" className="bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl border-2 border-blue-200/60 shadow-xl p-8 sm:p-10 lg:p-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 mb-4">
              <Gift className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Limited Time Offer</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Get Your $100 Bonus Credit
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Meet our founders in St. Louis or Toronto to discuss your supply chain strategy.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 rounded-xl bg-blue-50/50">
              <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">St. Louis & Toronto</h3>
              <p className="text-sm text-slate-600">In-person or Zoom meetings</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-emerald-50/50">
              <Gift className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">$100 Credit</h3>
              <p className="text-sm text-slate-600">Applied to your first order</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50/50">
              <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">March 31st, 2026</h3>
              <p className="text-sm text-slate-600">Deadline for this offer</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/contact?type=consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              Book Your Free Consultation
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Available until March 31st, 2026. Limited spots remaining.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

