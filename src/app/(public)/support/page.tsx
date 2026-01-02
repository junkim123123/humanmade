import { createClient } from "@/lib/supabase/server";
import { SupportForm } from "@/components/support/SupportForm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ category?: string; orderId?: string; reportId?: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const initialCategory = params?.category || null;
  const orderId = params?.orderId || null;
  const reportId = params?.reportId || null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Support</p>
          <h1 className="text-3xl font-bold text-slate-900">We’ll help you fast</h1>
          <p className="text-slate-600 text-sm">Pick a card to start. All requests go to the same team.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ id: "verification_help", title: "Verification help", desc: "Questions about sourcing or proofs" }, { id: "account_billing", title: "Account & billing", desc: "Access, plans, invoices" }, { id: "bug_report", title: "Report a bug", desc: "Tell us what broke" }].map((card) => {
            const href = `?category=${card.id}${orderId ? `&orderId=${orderId}` : ""}${reportId ? `&reportId=${reportId}` : ""}#support-form`;
            return (
              <a
                key={card.id}
                href={href}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow transition`}
              >
                <div className="font-semibold text-slate-900">{card.title}</div>
                <div className="text-sm text-slate-600 mt-1">{card.desc}</div>
                <div className="mt-3 inline-flex text-sm font-semibold text-blue-600">Start →</div>
              </a>
            );
          })}
        </div>

        <section id="support-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Contact support</h2>
            <p className="text-sm text-slate-600">We attach your account and page details so you do not have to.</p>
          </div>
          <SupportForm
            userEmail={user?.email || undefined}
            userId={user?.id || null}
            initialCategory={initialCategory}
            orderId={orderId}
            reportId={reportId}
          />
        </section>
      </div>
    </main>
  );
}
