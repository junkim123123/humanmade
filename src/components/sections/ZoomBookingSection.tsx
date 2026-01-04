"use client";

import { Calendar, MapPin, Gift, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function ZoomBookingSection() {
  return (
    <section id="zoom-booking" className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl border-2 border-indigo-200 shadow-xl p-8 sm:p-10 lg:p-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-4">
              <Gift className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">Limited Time Offer</span>
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
            <div className="text-center p-4 rounded-xl bg-indigo-50/50">
              <MapPin className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">St. Louis & Toronto</h3>
              <p className="text-sm text-slate-600">In-person or Zoom meetings</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-50/50">
              <Gift className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">$100 Credit</h3>
              <p className="text-sm text-slate-600">Applied to your first order</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-pink-50/50">
              <Clock className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">March 31st Deadline</h3>
              <p className="text-sm text-slate-600">Limited availability</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/contact?type=consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              Book Your Free Consultation
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Available until March 31st, 2024. Limited spots remaining.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

