import { createClient } from "@/lib/supabase/server";
import { SupportForm } from "@/components/support/SupportForm";
import { cookies } from "next/headers";
import { getUserOrders } from "@/server/actions/orders";
import { Sparkles, MessageCircle, Package, CreditCard, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ category?: string; orderId?: string; reportId?: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const initialCategory = params?.category || null;
  const orderId = params?.orderId || null;
  const reportId = params?.reportId || null;

  // Fetch user orders for redirection and dropdown
  let orders: any[] = [];
  if (user) {
    const orderRes = await getUserOrders({ limit: 10 });
    if (orderRes.success) {
      orders = orderRes.orders || [];
    }
  }

  const activeOrder = orders.find(o => ![ 'closed', 'delivered', 'cancelled' ].includes(o.status));

  const categories = [
    { id: "sourcing_quotes", title: "Sourcing & Quotes", desc: "Questions about factory details, MOQs, or landing costs.", icon: MessageCircle, color: "text-blue-600", bg: "hover:bg-blue-50/50", border: "hover:border-blue-200" },
    { id: "order_logistics", title: "Order Status / Logistics", desc: "Track production, QC reports, and freight status.", icon: Package, color: "text-emerald-600", bg: "hover:bg-emerald-50/50", border: "hover:border-emerald-200" },
    { id: "billing_credits", title: "Billing & Credits", desc: "Invoices, deposit credits, and refunds.", icon: CreditCard, color: "text-amber-600", bg: "hover:bg-amber-50/50", border: "hover:border-amber-200" },
    { id: "technical_issues", title: "Technical Issues", desc: "Website errors or file upload problems.", icon: Wrench, color: "text-slate-600", bg: "hover:bg-slate-100/50", border: "hover:border-slate-300" }
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        
        {/* nexi Branding Header */}
        <header className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white text-2xl font-bold shadow-xl shadow-blue-200 mb-2">
            n
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-500" />
              nexi is here to help
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              Your dedicated sourcing manager and AI assistant are ready to assist you 24/7.
            </p>
          </div>
        </header>

        {/* Category Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((card) => {
            const isOrderRelated = card.id === "sourcing_quotes" || card.id === "order_logistics";
            const redirectToOrder = isOrderRelated && activeOrder;
            
            const href = redirectToOrder 
              ? `/app/orders/${activeOrder.id}`
              : `?category=${card.id}${orderId ? `&orderId=${orderId}` : ""}${reportId ? `&reportId=${reportId}` : ""}#support-form`;

            return (
              <Link
                key={card.id}
                href={href}
                className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ${card.bg} ${card.border} hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4 transition-colors group-hover:bg-transparent ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{card.title}</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed flex-1">{card.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-600">
                  {redirectToOrder ? "Chat with Agent" : "Start Ticket"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Support Form Section */}
        <section id="support-form" className="max-w-3xl mx-auto rounded-[32px] border border-slate-200 bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Send a priority message</h2>
            <p className="text-slate-500 mt-1">We attach your account and order details automatically for faster resolution.</p>
          </div>
          <SupportForm
            userEmail={user?.email || undefined}
            userId={user?.id || null}
            initialCategory={initialCategory}
            orderId={orderId}
            reportId={reportId}
            orders={orders}
          />
        </section>
      </div>
    </main>
  );
}
