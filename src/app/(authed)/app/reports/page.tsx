import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FileText, Check, AlertCircle, Clock, Calendar, ArrowRight, Hourglass, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportListCTA } from "@/components/report/ReportListCTA";
import { extractProductName } from "@/lib/report/extractProductName";
import { formatDate, formatCurrency } from "@/lib/utils/format";

type DbReport = {
  id: string;
  product_name: string;
  category: string | null;
  status: "draft" | "processing" | "completed" | "failed";
  created_at: string;
  baseline: Record<string, any> | null;
};

type DbOrder = {
  id: string;
  report_id: string;
  status: string;
};

const statusBadge: Record<DbReport["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const statusIcon: Record<DbReport["status"], React.ReactNode> = {
  draft: <FileText className="w-4 h-4" />,
  processing: <Clock className="w-4 h-4 animate-spin" />,
  completed: <Check className="w-4 h-4" />,
  failed: <AlertCircle className="w-4 h-4" />,
};

function formatCost(baseline: DbReport["baseline"]) {
  const standard = (baseline as any)?.costRange?.standard?.totalLandedCost;
  if (typeof standard === "number" && isFinite(standard)) {
    return formatCurrency(standard) + " / unit";
  }
  return "Calculating...";
}

export default async function AppReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/app/reports");
  }

  const { data: reportsData, error } = await supabase
    .from("reports")
    .select("id, product_name, category, status, created_at, baseline")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Reports page] Failed to fetch reports", error.message);
  }

  const reports = (reportsData || []) as DbReport[];

  // Fetch orders to determine verification status
  const reportIds = reports.map((r) => r.id);
  const { data: ordersData } = reportIds.length > 0 
    ? await supabase
        .from("orders")
        .select("id, report_id, status")
        .in("report_id", reportIds)
    : { data: [] };

  const orders = (ordersData || []) as DbOrder[];
  const orderByReportId = new Map(orders.map((o) => [o.report_id, o]));

  // Calculate Total Potential Savings (Market Price - Landed Cost) * 1000 units/yr (estimated)
  let totalPotentialSavings = 0;
  reports.forEach((r) => {
    if (r.status === "completed" && r.baseline) {
      const landed = (r.baseline as any)?.costRange?.standard?.totalLandedCost;
      const shelf = (r.baseline as any)?.shelf_price;
      if (shelf && landed && shelf > landed) {
        // Estimate savings per unit vs shelf price (conservative 30% margin improvement)
        totalPotentialSavings += (shelf - landed) * 1000;
      }
    }
  });

  // Calculate stats based on actual business flow
  const pendingCount = reports.filter((r) => {
    // Report is completed but no order (verification not requested)
    return r.status === "completed" && !orderByReportId.has(r.id);
  }).length;

  const inVerificationCount = reports.filter((r) => {
    const order = orderByReportId.get(r.id);
    // Has order but not completed
    return order && order.status !== "completed" && order.status !== "cancelled";
  }).length;

  const completedCount = reports.filter((r) => {
    const order = orderByReportId.get(r.id);
    // Order is completed
    return order && order.status === "completed";
  }).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-10">
          <div className="text-center">
            <h1 className="text-[32px] sm:text-[40px] font-bold text-white leading-tight mb-3">
              Supply Chain Control Center
            </h1>
            <p className="text-[15px] text-slate-400 max-w-md mx-auto mb-6">
              Manage your factory direct sourcing pipeline. Track every step from analysis to warehouse delivery.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/app/analyze"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-slate-100 transition-colors"
              >
                + Free Analyze
              </Link>
              {totalPotentialSavings > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                  <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">Est. Annual Savings:</span>
                  <span className="text-[16px] font-bold text-white">${Math.round(totalPotentialSavings).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-8">
        {/* Pipeline Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900 mb-1">Pipeline Summary</h2>
            <p className="text-[13px] text-slate-500">Track every step from analysis to warehouse delivery</p>
          </div>
          <div className="text-[12px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            Updated just now
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Hourglass className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free Analyze</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{pendingCount}</div>
            <p className="text-[13px] text-slate-500 mt-2">Awaiting verification</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blueprint</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{inVerificationCount}</div>
            <p className="text-[13px] text-amber-600 mt-2 font-medium">Outreach in progress</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Execute</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{completedCount}</div>
            <p className="text-[13px] text-emerald-600 mt-2 font-medium">Quotes confirmed</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-slate-900">Active Products</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-medium text-slate-500">Live monitoring</span>
          </div>
        </div>
        <div className="space-y-4 mb-8">
          {reports.map((report) => {
            const costTarget = formatCost(report.baseline);
            const needsLabel = !(report.baseline as any)?.evidence?.hasLabel;
            return (
              <div
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 transition-all hover:shadow-md group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors">
                      <FileText className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {report.category || "Uncategorized"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-400" suppressHydrationWarning>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-tight ${statusBadge[report.status]}`}>
                    {statusIcon[report.status]}
                    <span className="capitalize">{report.status === "processing" ? "Analyzing" : report.status}</span>
                  </div>
                </div>

                {/* Product Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                    {extractProductName(report.product_name)}
                  </h3>
                  {needsLabel && report.status === "completed" && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Upload label to refine
                    </div>
                  )}
                </div>

                {/* Info Row */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex-1 min-w-[140px]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Cost</p>
                    <p className="text-[18px] font-bold text-slate-900">{costTarget}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex-1 min-w-[140px]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data Precision</p>
                    <p className="text-[18px] font-bold text-slate-900">
                      {report.status === "completed" ? "Refined" : "Analyzing"}
                    </p>
                  </div>
                </div>

                {/* View CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-50">
                  <p className="text-[13px] text-slate-500">Ready to move? Start verification to lock in factory quotes.</p>
                  <ReportListCTA reportId={report.id} status={report.status} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {reports.length === 0 && (
          <div className="text-center py-20 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="inline-flex p-6 rounded-2xl bg-white shadow-xl mb-6">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-[24px] font-bold text-slate-900 mb-3">Your High-Margin Product is Waiting.</h3>
            <p className="text-[15px] text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
              Upload a photo to calculate your potential profit instantly. Take 3 minutes to see your factory-direct cost.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/app/analyze"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-[16px] font-bold rounded-full hover:bg-slate-800 transition-all hover:scale-105 shadow-lg"
              >
                Analyze My Sourcing (Free)
              </Link>
              <p className="text-[12px] text-slate-400">Trusted by 2,000+ SMB sellers worldwide.</p>
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ArrowRight className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">Suggested next step</p>
                    <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                      Select a report and start verification. Our team will audit the factory and secure real-time quotes for you.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={reports[0] ? `/reports/${reports[0].id}/v2` : "/app/analyze"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-[13px] font-bold hover:bg-slate-100 transition-colors"
                  >
                    Open latest report
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-[14px] mb-4">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Workspace Privacy
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
                Your sourcing data is private. Only you can access this workspace.
              </p>
              <Link href="/help" className="text-[12px] font-bold text-blue-600 hover:underline">
                Learn more about our security →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
