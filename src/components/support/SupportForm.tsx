"use client";

import { useEffect, useMemo, useState } from "react";

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
}

export function SupportForm({ userEmail, userId, initialCategory, orderId, reportId }: SupportFormProps) {
  const [email, setEmail] = useState(userEmail || "");
  const [category, setCategory] = useState(initialCategory || "sourcing_quotes");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
      orderId: orderId || null,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-700 flex flex-col gap-1">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="text-sm text-slate-700 flex flex-col gap-1">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm text-slate-700 flex flex-col gap-1">
        Message
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Describe your question or issue"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="text-sm text-slate-700 flex flex-col gap-1">
        Screenshot (optional)
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="text-sm"
        />
      </label>

      {status === "success" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Request sent. We will reply soon.
        </div>
      )}
      {status === "error" && error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
