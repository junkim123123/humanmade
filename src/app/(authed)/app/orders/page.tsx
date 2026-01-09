"use client";

import { useEffect, useState } from "react";
import { getUserOrders } from "@/server/actions/orders";
import Link from "next/link";
import { Package, ArrowRight, Factory, Search, Ship } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/format";

type OrderStatus =
  | "awaiting_contact"
  | "contacted"
  | "meeting_scheduled"
  | "closed"
  | "awaiting_invoice"
  | "awaiting_payment"
  | "in_progress"
  | "pending_shipment"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Order {
  id: string;
  order_number: string;
  product_name: string;
  supplier_name: string;
  quantity: number;
  total_amount: number;
  status: OrderStatus;
  type?: string;
  created_at: string;
  estimated_delivery?: string;
  current_milestone?: string;
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  awaiting_contact: { label: "Awaiting contact", bg: "bg-amber-50", text: "text-amber-700" },
  contacted: { label: "Contacted", bg: "bg-blue-50", text: "text-blue-700" },
  meeting_scheduled: { label: "Meeting scheduled", bg: "bg-blue-50", text: "text-blue-700" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600" },
  awaiting_invoice: { label: "Awaiting invoice", bg: "bg-amber-50", text: "text-amber-700" },
  awaiting_payment: { label: "Awaiting payment", bg: "bg-amber-50", text: "text-amber-700" },
  in_progress: { label: "In progress", bg: "bg-blue-50", text: "text-blue-700" },
  pending_shipment: { label: "Pending shipment", bg: "bg-amber-50", text: "text-amber-700" },
  shipped: { label: "Shipped", bg: "bg-blue-50", text: "text-blue-700" },
  delivered: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const result = await getUserOrders({});
        if (result.error) {
          setError(result.error);
        } else {
          setOrders(result.orders || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-slate-900">Active Shipments</h1>
              <p className="text-[14px] text-slate-500">Track production status, QC reports, and freight location in real-time.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-8">
        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-slate-500">Loading orders...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-[14px] text-red-700 font-medium mb-1">Error loading orders</p>
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16">
            {/* 3-Step Icon Flow */}
            <div className="flex items-center justify-center gap-4 mb-8 max-w-md mx-auto">
              {/* Step 1: Production */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <Factory className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-[12px] font-medium text-slate-600">Production</span>
              </div>
              
              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              
              {/* Step 2: QC Check */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Search className="w-8 h-8 text-amber-600" />
                </div>
                <span className="text-[12px] font-medium text-slate-600">QC Check</span>
              </div>
              
              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              
              {/* Step 3: Ocean Freight */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Ship className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="text-[12px] font-medium text-slate-600">Ocean Freight</span>
              </div>
            </div>

            <h3 className="text-[24px] font-bold text-slate-900 mb-3">No active shipments yet.</h3>
            <p className="text-[15px] text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
              Once you approve a factory quote from your Blueprint, your order will move through production, QC, and ocean freight right here.
            </p>
            <Link
              href="/app/reports"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-[15px] font-bold rounded-full hover:bg-slate-800 transition-all hover:scale-105 shadow-lg"
            >
              Go to Blueprints
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-8">
            {orders.map((order) => {
              const config = statusConfig[order.status];
              return (
                <Link key={order.id} href={`/app/orders/${order.id}`} className="block">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">
                          {order.product_name}
                        </h3>
                        <p className="text-[13px] text-slate-400 mt-1">Order ID: {order.order_number}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-4 gap-4 py-4 border-t border-slate-100">
                      <div>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Supplier</p>
                        <p className="text-[14px] text-slate-900 mt-0.5">{order.supplier_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Quantity</p>
                        <p className="text-[14px] text-slate-900 mt-0.5">{order.quantity ? `${order.quantity} units` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Total</p>
                        <p className="text-[14px] text-slate-900 mt-0.5">
                          {order.total_amount ? formatCurrency(order.total_amount) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Est. Delivery</p>
                        <p className="text-[14px] text-slate-900 mt-0.5">
                          {order.estimated_delivery ? formatDate(order.estimated_delivery) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* View details link */}
                    <div className="flex items-center justify-end pt-3 text-slate-400 group-hover:text-slate-900 transition-colors">
                      <span className="text-[13px] font-medium">View details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

