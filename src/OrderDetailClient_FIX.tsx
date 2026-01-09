"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, MessageCircle, Send, Clock, Mail, Phone, Check, Paperclip } from "lucide-react";
import { getOrderDetail, sendOrderMessage, updateOrderContact } from "@/server/actions/orders";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils/format";

interface OrderDetailData {
  id: string;
  order_number: string;
  product_name: string;
  supplier_name: string;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  status: string;
  destination_country: string;
  created_at: string;
  messages?: MessageRecord[];
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  milestones?: any[];
}

interface MessageRecord {
  id: string;
  order_id: string;
  sender_id?: string | null;
  sender_role?: string | null;
  body?: string | null;
  created_at?: string | null;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  awaiting_contact: { bg: "bg-amber-50", text: "text-amber-700" },
  contacted: { bg: "bg-blue-50", text: "text-blue-700" },
  meeting_scheduled: { bg: "bg-blue-50", text: "text-blue-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-600" },
  awaiting_invoice: { bg: "bg-amber-50", text: "text-amber-700" },
  awaiting_payment: { bg: "bg-amber-50", text: "text-amber-700" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700" },
  pending_shipment: { bg: "bg-amber-50", text: "text-amber-700" },
  shipped: { bg: "bg-blue-50", text: "text-blue-700" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-50", text: "text-red-700" },
};

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    async function loadOrder() {
      try {
        const result = await getOrderDetail(orderId);
        if (result.error) {
          setError(result.error);
        } else if (result.order) {
          setOrder(result.order as OrderDetailData);
          setMessages((result.order as any)?.messages || []);
          setMilestones(result.milestones || []);
          setContactEmail((result.order as any)?.contact_email || "");
          setContactPhone((result.order as any)?.contact_whatsapp || "");
          if ((result.order as any)?.contact_email || (result.order as any)?.contact_whatsapp) {
            setContactSaved(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    void loadOrder();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSaveContact = async () => {
    if (!contactEmail.trim() && !contactPhone.trim()) return;
    setIsSavingContact(true);
    try {
      const res = await updateOrderContact(orderId, {
        contactEmail: contactEmail.trim() || undefined,
        contactWhatsapp: contactPhone.trim() || undefined,
      });
      if (res.success) {
        setContactSaved(true);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSendMessage = async () => {
    const body = messageInput.trim();
    if (!body) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await sendOrderMessage(orderId, body, "user");
      if (!res.success) {
        setError(res.detail || res.error || "Failed to send message");
        return;
      }
      const appended = res.message
        ? res.message
        : {
            id: res.messageId || `local-${Date.now()}`,
            order_id: orderId,
            sender_id: null,
            sender_role: "user",
            body,
            created_at: new Date().toISOString(),
          };
      setMessages((prev) => [...prev, appended]);
      setMessageInput("");
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formattedMessages = useMemo(() => {
    return (messages || []).map((m) => {
      const senderRole = m.sender_role || "user";
      const isUser = senderRole === "user";
      const label = isUser ? "You" : "NexSupply";
      const body = (m.body || "").trim() || "Empty message";
      const timestamp = m.created_at ? formatDateTime(m.created_at) : "";
      return { ...m, senderRole, isUser, label, body, timestamp };
    });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-slate-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/app/orders" className="inline-flex items-center gap-2 text-[14px] text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h2 className="font-semibold text-red-900 mb-1">Error loading order</h2>
                <p className="text-[14px] text-red-700">{error || "Order not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || { bg: "bg-slate-100", text: "text-slate-600" };

  const quickReplies = [
    "Need Korean manager",
    "Samples first, please",
    "Target price is $X",
    "Target quantity is Y"
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/app/orders" className="inline-flex items-center gap-1 text-[14px] text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Pipeline
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-medium text-slate-500">Live Case</span>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-slate-400 font-medium">Order #{order.order_number}</p>
              <h1 className="text-[24px] font-bold text-slate-900 mt-1">{order.product_name}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-[12px] font-bold tracking-tight uppercase ${status.bg} ${status.text}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-3xl py-8 space-y-8">
        {/* Manager Profile Notice */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                N
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[16px] font-bold text-slate-900">Nexy (Dedicated Manager)</h3>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Online</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                I&apos;ll be handling your factory outreach and logistics. Standard response time is under 3 hours.
              </p>
            </div>
          </div>
          
          {!contactSaved ? (
            <div className="mt-6 p-4 rounded-xl bg-white border border-blue-100 space-y-4">
              <p className="text-[13px] font-semibold text-slate-700">Get notified when quotes arrive:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex-1 relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="WhatsApp (optional)"
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveContact}
                disabled={isSavingContact || (!contactEmail.trim() && !contactPhone.trim())}
                className="w-full h-11 bg-slate-900 text-white rounded-lg font-bold text-[14px] hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {isSavingContact ? "Saving..." : "Keep me updated"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-[13px] text-emerald-700 font-bold bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <Check className="w-4 h-4" />
              Contact info saved. Nexy will notify you soon.
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest">Order Details</h2>
            <Link href={`/reports/${orderId}/v2`} className="text-[12px] font-bold text-blue-600 hover:underline">View Blueprint →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier</p>
              <p className="text-[15px] font-bold text-slate-900">{order.supplier_name || "Contacting factories..."}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quantity</p>
              <p className="text-[15px] font-bold text-slate-900">{order.quantity ? `${order.quantity.toLocaleString()} units` : "Target units needed"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Landed Total</p>
              <p className="text-[15px] font-bold text-slate-900">
                {order.total_amount ? formatCurrency(order.total_amount) : "Calculating..."}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Created</p>
              <p className="text-[15px] font-bold text-slate-900">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Callout */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-1">Boost Quote Speed</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              Enter your target quantity and upload a clear label photo to speed up HS classification and supplier negotiation.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg bg-white border border-amber-200 text-[13px] font-bold text-amber-800 hover:bg-amber-50 transition-colors shadow-sm">
                Set Target Quantity
              </button>
              <button className="px-4 py-2 rounded-lg bg-white border border-amber-200 text-[13px] font-bold text-amber-800 hover:bg-amber-50 transition-colors shadow-sm">
                Upload Label
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <OrderTimeline milestones={milestones} />

        {/* Messages */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest">Direct Support</h2>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">Chat with Nexy about this product</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-bold text-slate-400">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              Real-time Channel
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50/80 rounded-2xl p-6 space-y-4 h-[400px] overflow-y-auto mb-6 scrollbar-hide border border-slate-100">
              {formattedMessages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white text-slate-900 border border-blue-100 shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-blue-600 mb-2">Nexy • Just now</p>
                    <p className="text-[14px] leading-relaxed">
                      Hello! I&apos;m your sourcing manager. To speed up your quotes, please let me know:<br/><br/>
                      1. Your target unit price<br/>
                      2. Estimated order quantity<br/>
                      3. If you need samples first
                    </p>
                  </div>
                </div>
              )}
              {formattedMessages.map((message) => (
                <div key={message.id || message.created_at} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                    message.isUser
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 border border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-2 text-[10px] uppercase tracking-widest font-bold">
                      <span className={message.isUser ? "text-white/60" : "text-slate-400"}>{message.label}</span>
                      <span className={message.isUser ? "text-white/40" : "text-slate-300"}>{message.timestamp}</span>
                    </div>
                    <p className="text-[14px] whitespace-pre-wrap leading-relaxed font-medium">{message.body}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setMessageInput(reply)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[12px] font-bold hover:bg-blue-50 hover:text-blue-700 transition-all border border-slate-200 hover:border-blue-200"
                >
                  {reply}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3 bg-white p-1 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-600 transition-all shadow-inner">
              <button className="p-3 text-slate-400 hover:text-blue-600 transition-colors">
                <Paperclip className="w-6 h-6" />
              </button>
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Nexy..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:outline-none p-3 text-[14px] resize-none font-medium"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !messageInput.trim()}
                className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md m-1"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
