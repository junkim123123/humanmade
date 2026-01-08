"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Package, Send } from "lucide-react";

const categories = [
  { id: "sourcing_quotes", label: "Sourcing & Quotes" },
  { id: "order_logistics", label: "Order Status / Logistics" },
  { id: "billing_credits", label: "Billing & Credits" },
  { id: "technical_issues", label: "Technical Issues" },
];

interface SupportFormProps {
  userEmail?: string;
  userId?: string | null;
  initialCategory?: string | null;
  orderId?: string | null;
  reportId?: string | null;
  orders?: any[];
}

export function SupportForm({ userEmail, userId, initialCategory, orderId, reportId, orders = [] }: SupportFormProps) {
  const [email, setEmail] = useState(userEmail || "");
  const [category, setCategory] = useState(initialCategory || "sourcing_quotes");
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || "");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!message.trim()) return false;
    if (!category) return false;
    return true;
  }, [email, message, category]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshot(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setScreenshot(file);
  };

  const buildMetadata = async () => {
    const url = window?.location?.href || "";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    let screenshotData: string | null = null;

    if (screenshot) {
      const arrayBuffer = await screenshot.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = typeof btoa === "function" ? btoa(binary) : "";
      screenshotData = base64 ? `data:${screenshot.type};base64,${base64}` : null;
    }

    return {
      userId: userId || null,
      orderId: selectedOrderId || orderId || null,
      reportId: reportId || null,
      url,
      userAgent,
      screenshot: screenshotData,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setStatus("idle");
    setError(null);

    try {
      const metadata = await buildMetadata();
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), category, message: message.trim(), metadata }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "We could not send your request. Please try again.");
      }

      setStatus("success");
      setMessage("");
      setScreenshot(null);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "We could not send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 text-left">
        {userEmail ? (
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Account Email</label>
            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
              {userEmail}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="flex flex-col gap-2 text-left">
          <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Related Product (Optional)</label>
          <div className="relative">
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
            >
              <option value="">Select a product</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.product_name} ({o.status.replace('_', ' ')})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 text-left">
        <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">How can we help?</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Please provide as much detail as possible..."
          className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
        />
      </div>

      <div className="flex flex-col gap-2 text-left">
        <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Screenshot (optional)</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`group relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-6 flex flex-col items-center justify-center gap-2 ${
            screenshot ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {screenshot ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{screenshot.name}</p>
                <p className="text-xs text-slate-500">{(screenshot.size / 1024).toFixed(1)} KB</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                className="p-1 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">Click or drag image to upload</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 10MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {status === "success" && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-bold text-emerald-900">Message sent successfully!</p>
            <p className="text-xs text-emerald-700 mt-0.5">nexi and our support team will get back to you shortly via email.</p>
          </div>
        </div>
      )}
      {status === "error" && error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-bold text-red-900">Failed to send request</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            "Processing..."
          ) : (
            <>
              Submit Ticket
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
