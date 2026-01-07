import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FileText, Check, AlertCircle, Clock, Calendar, ArrowRight, Hourglass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportListCTA } from "@/components/report/ReportListCTA";

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
    return `$${standard.toFixed(2)} / unit`;
  }
  return "Pending";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Extract product name from product_name field
 * Handles both JSON format and plain string
 */
function extractProductName(productName: string | null | undefined): string {
  if (!productName) return "Unknown Product";
  
  // Try to parse as JSON (in case it's stored as JSON string)
  try {
    const parsed = JSON.parse(productName);
    if (typeof parsed === "object" && parsed !== null) {
      // Prefer fullName, then brand, then fallback to first available string
      if (parsed.fullName && typeof parsed.fullName === "string") {
        return parsed.fullName;
      }
      if (parsed.brand && typeof parsed.brand === "string") {
        return parsed.brand;
      }
      if (parsed.productName && typeof parsed.productName === "string") {
        return parsed.productName;
      }
    }
  } catch {
    // Not JSON, use as-is
  }
  
  // Return as plain string if not JSON or parsing failed
  return productName;
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
              Sourcing, verification, logistics—all in one.
            </h1>
            <p className="text-[15px] text-slate-400 max-w-md mx-auto mb-6">
              From factory to your door. We run the chaos so you can sell.
            </p>
            <Link
              href="/app/analyze"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-slate-100 transition-colors"
            >
              + Start new analysis
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-8">
        {/* Control Center Header */}
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-slate-900 mb-1">Supply Chain Control Center</h2>
          <p className="text-[13px] text-slate-500">Monitor your sourcing pipeline from analysis to delivery</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Hourglass className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Analyzing</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{pendingCount}</div>
            <p className="text-[14px] text-slate-500 mt-1">Awaiting verification</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Verifying</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{inVerificationCount}</div>
            <p className="text-[14px] text-amber-600 mt-1">In progress</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Ready to Order</span>
            </div>
            <div className="text-[32px] font-bold text-slate-900 leading-none">{completedCount}</div>
            <p className="text-[14px] text-emerald-600 mt-1">Verification complete</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-slate-900 mb-4">Your Products</h2>
        </div>
        <div className="space-y-4 mb-8">
          {reports.map((report) => {
            const costTarget = formatCost(report.baseline);
            return (
              <div
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wide">
                        {report.category || "Uncategorized"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-400" suppressHydrationWarning>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${statusBadge[report.status]}`}>
                    {statusIcon[report.status]}
                    <span className="capitalize">{report.status === "processing" ? "In review" : report.status}</span>
                  </div>
                </div>

                {/* Product Name */}
                <h3 className="text-[18px] font-semibold text-slate-900 leading-tight mb-4">
                  {extractProductName(report.product_name)}
                </h3>

                {/* Target Cost */}
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 mb-4 max-w-xs">
                  <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Target Cost</p>
                  <p className="text-[16px] font-bold text-slate-900">{costTarget}</p>
                </div>

                {/* View CTA */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] text-slate-500">Ready to move? Start verification and we&apos;ll take it to production.</p>
                  <ReportListCTA reportId={report.id} status={report.status} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {reports.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 mb-5">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-[24px] font-bold text-slate-900 mb-2">Your High-Margin Product is Waiting.</h3>
            <p className="text-[15px] text-slate-600 mb-6 max-w-md mx-auto">
              Upload a photo to calculate your potential profit instantly. It takes 3 minutes.
            </p>
            <Link
              href="/app/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[15px] font-semibold rounded-full hover:bg-slate-800 transition-colors"
            >
              Start Free Analysis
            </Link>
          </div>
        )}

        {reports.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3 mb-4">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-slate-900">Suggested next step</p>
                  <p className="text-[13px] text-slate-600 mt-0.5">
                    Pick any completed report and request verification to kick off production. We&apos;ll queue a factory audit and sample check for you.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href={reports[0] ? `/reports/${reports[0].id}/v2` : "/app/analyze"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors"
                >
                  Open latest
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/app/verifications"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white text-[13px] font-medium text-slate-700 hover:border-slate-400 transition-colors"
                >
                  View verification queue
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-amber-600 font-medium text-[13px] mb-2">
                <AlertCircle className="w-4 h-4" />
                Quick reminders
              </div>
              <ul className="space-y-1.5 text-[13px] text-slate-600">
                <li>Only you can see this workspace — row-level security keeps your data isolated.</li>
                <li>Uploads are stored in your own uploads bucket, tied to your user ID.</li>
                <li>Need help? Run a new analysis and just share the report link with us.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



