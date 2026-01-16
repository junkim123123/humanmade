"use client";

import { Calendar, MapPin, Gift, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function ZoomBookingSection() {
  const [showModal, setShowModal] = useState(false);
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    
    setError(null);
    setSubmitted(true);
    
    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactInfo: contact, source: "zoom_booking_section" }),
      });
      const result = await response.json();

      if (response.ok && result?.success) {
        setTimeout(() => {
          setShowModal(false);
          setContact("");
          setSubmitted(false);
        }, 1500);
      } else {
        setError("Failed to submit. Please try again.");
        setSubmitted(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setSubmitted(false);
    }
  };

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
              Your First Consultation Credit
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
                <p className="text-sm text-slate-600">In-person or virtual meetings</p>
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
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              Book Your Offline Consultation
            </button>
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-sm relative">
                  <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowModal(false)}>&times;</button>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Leave your email or phone</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="Email or phone number"
                      className="w-full border rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      disabled={submitted}
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                      disabled={submitted}
                    >
                      {submitted && !error ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                  {error && <p className="text-red-500 text-center mt-2 text-sm">{error}</p>}
                  {submitted && !error && <p className="text-green-600 text-center mt-2">Submitted! We'll contact you soon.</p>}
                </div>
              </div>
            )}
            <p className="mt-4 text-sm text-slate-500">
              Available until March 31st, 2026. Limited spots remaining.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

