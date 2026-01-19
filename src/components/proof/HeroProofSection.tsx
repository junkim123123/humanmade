import type { ReactNode } from "react";

type Cta = {
  label: string;
  href: string;
  helper?: string;
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
  const helperLine = [primaryCta.helper, secondaryCta.helper].filter(Boolean).join(" · ");

  return (
    <section id="proof-hero" className="bg-slate-50/70 py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-slate-900">
            {headline}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-slate-600">
            {subheadline}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {primaryCta.label}
            </a>
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-[15px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              {secondaryCta.label}
            </a>
          </div>

          {helperLine.length > 0 && (
            <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-500">{helperLine}</p>
          )}
        </div>

        <div className="mt-10">
          <div className="mx-auto max-w-4xl border-t border-slate-200/70 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {proofPackItems.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-white/70 ring-1 ring-slate-200 p-2 text-slate-700">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{item.description}</p>
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
