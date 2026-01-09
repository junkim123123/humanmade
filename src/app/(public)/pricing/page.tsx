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
    <main className="min-h-screen bg-gradient-to-b from-slate-50/90 to-slate-100/80 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-[34px] sm:text-[40px] font-bold tracking-[-0.03em] text-slate-900">
            Pricing
          </h1>
          <p className="mt-2 text-[16px] sm:text-[18px] text-slate-600">
            Start free. Pay a deposit only when you want verified quotes. Get it back when you order.
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Outreach starts within 12 hours. Quotes arrive in about a week.
          </p>
        </header>

        {/* 3D main pricing card */}
        <section
          className="
            rounded-3xl border border-slate-200 bg-white/95
            shadow-[0_26px_70px_rgba(15,23,42,0.18)]
            backdrop-blur-sm
            overflow-hidden
            mb-12
          "
        >
          {/* Free / Verification / Execution stack */}
          <div className="divide-y divide-slate-200">
            {/* Free Analyze */}
            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h2 className="text-[18px] font-semibold text-slate-900 mb-1">
                  Free Analyze
                </h2>
                <p className="text-[14px] text-slate-600 max-w-md">
                  Instant Landed Cost &amp; Profit Analysis using AI and import data.
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-baseline gap-1 rounded-full bg-emerald-50 px-3 py-1">
                  <span className="text-[20px] sm:text-[26px] font-bold text-slate-900">
                    $0
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Free snapshot
                  </span>
                </div>
              </div>
            </div>

            {/* Blueprint */}
            <div id="deposit" className="p-6 bg-slate-50/90">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h2 className="text-[18px] font-semibold text-slate-900 mb-1">
                    Blueprint
                  </h2>
                  <p className="text-[14px] text-slate-600 max-w-md">
                    We validate the factory, negotiate MOQs, and confirm the exact landed cost blueprint.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[26px] font-bold text-slate-900">
                    $49
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1">
                    Sourcing Deposit
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 text-[12px] font-semibold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
                  100% credited to your first order
                </span>
                <span className="text-[12px] text-slate-500">
                  Per product. Not a fee if you order.
                </span>
              </div>
            </div>

            {/* Execute */}
            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h2 className="text-[18px] font-semibold text-slate-900 mb-1">
                    Execute
                  </h2>
                  <p className="text-[14px] text-slate-600 max-w-md">
                    End-to-end logistics coordination, from factory floor to your door.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[26px] font-bold text-slate-900">
                    7%
                  </div>
                  <p className="text-[12px] text-slate-500">
                    of FOB, only when you place an order
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-slate-500 italic max-w-md">
                Logistics costs are passed through at cost. We charge a 7% service fee on FOB to manage the chaos.
              </p>
            </div>
          </div>
        </section>

        {/* What You Get - 3D Card Grid */}
        <section className="mb-12">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 text-center">
            What you get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Analyze */}
            <div
              className="
                rounded-2xl border border-slate-200 bg-white/90 p-6
                shadow-[0_16px_40px_rgba(15,23,42,0.12)]
                transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_50px_rgba(15,23,42,0.18)]
              "
            >
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Free Analyze</h3>
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

            {/* Blueprint */}
            <div
              className="
                rounded-2xl border-2 border-slate-900 bg-white/95 p-6
                shadow-[0_18px_45px_rgba(15,23,42,0.15)]
                transition-all hover:translate-y-[-2px] hover:shadow-[0_22px_55px_rgba(15,23,42,0.22)]
              "
            >
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Blueprint</h3>
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

            {/* Execute */}
            <div
              className="
                rounded-2xl border border-slate-200 bg-white/90 p-6
                shadow-[0_16px_40px_rgba(15,23,42,0.12)]
                transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_50px_rgba(15,23,42,0.18)]
              "
            >
              <h3 className="text-[16px] font-semibold text-slate-900 mb-4">Execute</h3>
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

        {/* Verification Timeline - Vertical Timeline Card */}
        <section className="mb-12">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 text-center">
            Verification timeline
          </h2>
          <div
            className="
              rounded-3xl border border-slate-200 bg-white/95
              shadow-[0_22px_60px_rgba(15,23,42,0.15)]
              backdrop-blur-sm
              p-6 lg:p-8
            "
          >
            <div className="space-y-6">
              {[
                { step: 1, title: "Start outreach", time: "within 12h", desc: "We confirm specs and start outreach." },
                { step: 2, title: "Validate quotes", time: "regular updates", desc: "We share updates while validating quotes and details." },
                { step: 3, title: "Deliver quotes", time: "about 1 week", desc: "At least 3 viable quotes with MOQ and lead time" },
              ].map((item, index) => (
                <div key={item.step} className="flex gap-4">
                  {/* Step Pill */}
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[16px]">
                      {item.step}
                    </div>
                    {index < 2 && (
                      <div className="w-0.5 h-full bg-slate-200 mx-auto mt-2 min-h-[60px]" />
                    )}
                  </div>
                  {/* Content Card */}
                  <div
                    className="
                      flex-1 rounded-2xl border border-slate-200 bg-slate-50/90 p-4
                      shadow-[0_8px_20px_rgba(15,23,42,0.08)]
                      transition-all hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]
                    "
                  >
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
                      Step {item.step}: {item.title}
                    </h3>
                    <p className="text-[13px] text-slate-600 font-medium mb-2">{item.time}</p>
                    <p className="text-[13px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proof and Assumptions */}
        <section className="mb-12">
          <div
            className="
              rounded-2xl border border-slate-200 bg-slate-50/90 p-8 text-center
              shadow-[0_16px_40px_rgba(15,23,42,0.12)]
            "
          >
            <div className="max-w-xl mx-auto space-y-2">
              <p className="text-[15px] text-slate-700">When we find matching import shipments, we attach them.</p>
              <p className="text-[15px] text-slate-700">If we cannot, we show assumptions clearly.</p>
              <p className="text-[13px] text-slate-500 mt-3">Import records refresh regularly when available.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div
            className="
              max-w-2xl mx-auto divide-y divide-slate-200
              rounded-2xl border border-slate-200 bg-white/95
              shadow-[0_16px_40px_rgba(15,23,42,0.12)]
              overflow-hidden
            "
          >
            {[
              {
                q: "How accurate is the free estimate?",
                a: "A practical range for quick margin checks based on category benchmarks and shipping assumptions. Use it for go/no-go and sizing next steps.",
              },
              {
                q: "What do I get for $49?",
                a: "Outreach starts within 12 hours. In about a week you get at least 3 viable quotes with MOQ, lead time, and label/origin checks. The $49 is a deposit, not a fee—100% credited back to your first order.",
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
        <section className="text-center pt-8 border-t border-slate-200/50">
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
    </main>
  );
}

