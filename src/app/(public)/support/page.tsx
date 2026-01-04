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
          <h1 className="text-3xl font-bold text-slate-900">Expert Support</h1>
          <p className="text-slate-600 text-sm">Direct access to your sourcing agents and logistics team.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "sourcing_quotes", title: "Sourcing & Quotes", desc: "Questions about factory details, MOQs, or landing costs." },
            { id: "order_logistics", title: "Order Status / Logistics", desc: "Track production, QC reports, and freight status." },
            { id: "billing_credits", title: "Billing & Credits", desc: "Invoices, deposit credits, and refunds." },
            { id: "technical_issues", title: "Technical Issues", desc: "Website errors or file upload problems." }
          ].map((card) => {
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
            <p className="text-sm text-slate-600">We attach your account and order details automatically.</p>
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
