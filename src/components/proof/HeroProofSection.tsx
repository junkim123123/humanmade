import type { ReactNode } from "react";

type Cta = {
  label: string;
  href: string;
  helper: string;
};

type ProofPackItem = {
  icon: ReactNode;
  title: string;
  description: string;
};

interface HeroProofSectionProps {
  headline: string;
  subheadline: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  proofPackItems: ProofPackItem[];
}

export function HeroProofSection({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  proofPackItems,
}: HeroProofSectionProps) {
  return (
    <section id="proof-hero" className="bg-slate-50/80 py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_26px_70px_rgba(15,23,42,0.18)] backdrop-blur-sm px-6 py-7 sm:px-10 sm:py-9">
          <div className="text-center">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 mb-2">
              {headline}
            </h1>
            <p className="text-[15px] text-slate-600 mb-6">
              {subheadline}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <a
                  href={primaryCta.href}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-[15px] font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.5)] hover:bg-slate-800 hover:shadow-[0_22px_55px_rgba(15,23,42,0.6)] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  {primaryCta.label}
                </a>
                <p className="mt-2 text-[12px] text-slate-500">{primaryCta.helper}</p>
              </div>
              <div className="flex flex-col items-center">
                <a
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-6 py-2.5 text-[15px] font-semibold text-slate-900 border border-slate-200 hover:bg-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  {secondaryCta.label}
                </a>
                <p className="mt-2 text-[12px] text-slate-500">{secondaryCta.helper}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {proofPackItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-700">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[12px] text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
