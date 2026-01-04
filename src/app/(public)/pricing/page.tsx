"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";

export default function PricingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-[40px] font-bold text-slate-900 tracking-[-0.02em] mb-4">
            Pricing
          </h1>
          <p className="text-[18px] text-slate-600 mb-2">
            Start free. Pay a deposit only when you want verified quotes. Get it back when you order.
          </p>
          <p className="text-[14px] text-slate-500">
            Outreach starts within 12 hours. Quotes arrive in about a week.
          </p>
        </section>

        {/* Pricing Table */}
        <section className="mb-20">
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
            {/* Free */}
            <div className="p-6 flex items-start justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-[18px] font-semibold text-slate-900 mb-1">Free Analysis</h3>
                <p className="text-[14px] text-slate-600">
                  Instant Landed Cost & Profit Analysis using AI and import data.
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[28px] font-bold text-slate-900">$0</div>
              </div>
            </div>

            {/* Verification */}
            <div id="deposit" className="p-6 bg-slate-50">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-[18px] font-semibold text-slate-900 mb-1">Verification</h3>
                  <p className="text-[14px] text-slate-600">
                    We validate the factory, negotiate MOQs, and confirm the exact landed cost blueprint.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[28px] font-bold text-slate-900">$45</div>
                  <p className="text-[12px] text-slate-500 mt-1">Sourcing Deposit</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 text-[12px] font-semibold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
                  100% Credited back to your first order
                </span>
                <span className="text-[12px] text-slate-500">Deposit per product (not a fee if you order)</span>
              </div>
            </div>

            {/* Execution */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-[18px] font-semibold text-slate-900 mb-1">Execution</h3>
                  <p className="text-[14px] text-slate-600">
                    End-to-end logistics coordination, from factory floor to your door.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[28px] font-bold text-slate-900">10%</div>
                  <p className="text-[12px] text-slate-500">of FOB, only when you place an order</p>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 mt-3 italic">
                (Logistics costs are passed through at cost, we charge 10% service fee on FOB to manage the chaos.)
              </p>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="mb-20">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 text-center">What you get</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Free Analysis</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Product classification and search keywords</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Delivered cost range and factory price range</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Profit Margin Calculation</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Risk checklist and what to verify</span>
                </li>
              </ul>
            </div>

            {/* Verification */}
            <div className="rounded-xl border border-slate-900 bg-white p-6">
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Verification</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>At least 3 viable factory quotes</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>MOQ and lead time confirmed</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Label, origin, and compliance checks</span>
                </li>
              </ul>
            </div>

            {/* Execution */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Execution</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Factory negotiation and order placement support</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Sample coordination and QC support</span>
                </li>
                <li className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Logistics, documents, and port delivery coordination</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Proof and Assumptions */}
        <section className="mb-20">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <div className="max-w-xl mx-auto space-y-2">
              <p className="text-[15px] text-slate-700">When we find matching import shipments, we attach them.</p>
              <p className="text-[15px] text-slate-700">If we cannot, we show assumptions clearly.</p>
              <p className="text-[13px] text-slate-500 mt-3">Import records refresh regularly when available.</p>
            </div>
          </div>
        </section>

        {/* Verification Timeline */}
        <section className="mb-20">
          <h2 className="text-[24px] font-bold text-slate-900 mb-10 text-center">Verification timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Start outreach", time: "within 12h", desc: "We confirm specs and start outreach." },
              { step: 2, title: "Validate quotes", time: "regular updates", desc: "We share updates while validating quotes and details." },
              { step: 3, title: "Deliver quotes", time: "about 1 week", desc: "At least 3 viable quotes with MOQ and lead time" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[18px] mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Step {item.step}: {item.title}</h3>
                <p className="text-[13px] text-slate-600 font-medium mb-2">{item.time}</p>
                <p className="text-[13px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="max-w-2xl mx-auto divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {[
              {
                q: "How accurate is the free estimate?",
                a: "A practical range for quick margin checks based on category benchmarks and shipping assumptions. Use it for go/no-go and sizing next steps.",
              },
              {
                q: "What do I get for $45?",
                a: "Outreach starts within 12 hours. In about a week you get at least 3 viable quotes with MOQ, lead time, and label/origin checks. The $45 is a deposit, not a fee—100% credited back to your first order.",
              },
              {
                q: "When is evidence attached?",
                a: "When we match your product to import records. Records refresh regularly when available to increase confidence in the baseline.",
              },
              {
                q: "What if no customs record is found?",
                a: "We label assumptions clearly. Verification still gets you supplier quotes and a ready-to-buy plan even without customs data.",
              },
              {
                q: "What do you need from me to start?",
                a: "A product photo is enough to begin. We handle identification, outreach, and verification.",
              },
            ].map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[15px] font-medium text-slate-900">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFAQ === index ? "rotate-180" : ""}`} />
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-[14px] text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="text-center pt-8 border-t border-slate-200">
          <p className="text-[14px] text-slate-600">
            Want an estimate now?{" "}
            <Link
              href="/analyze"
              className="text-slate-900 hover:text-slate-700 underline underline-offset-2 transition-colors"
            >
              Visit Analyze
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

