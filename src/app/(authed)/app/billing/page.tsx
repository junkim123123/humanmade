"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, HelpCircle, Gift, Check, X } from "lucide-react";
import { fetchMyCredits, fetchMyCreditTransactions } from "./actions";
import type { CreditTransaction } from "@/server/actions/credits";

const CREDIT_VALUE = 45; // $45 per credit

const transactionTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  admin_grant: { label: "Credit added", icon: ArrowUpRight, color: "text-emerald-600" },
  verification_used: { label: "Verification deposit", icon: ArrowDownRight, color: "text-red-600" },
  refund: { label: "Deposit refunded", icon: RefreshCw, color: "text-blue-600" },
  adjustment: { label: "Adjustment", icon: RefreshCw, color: "text-slate-600" },
};

export default function BillingPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Convert credits to dollar amount
  const balanceInDollars = balance * CREDIT_VALUE;

  // --- [FIX] Refactor data loading into a single function ---
  const loadData = async () => {
    try {
      const [creditsRes, txRes] = await Promise.all([
        fetchMyCredits(),
        fetchMyCreditTransactions()
      ]);
      if (creditsRes.success) {
        setBalance(creditsRes.balance || 0);
      }
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRedeemCode = async () => {
    if (!codeInput.trim()) {
      setCodeMessage({ type: "error", text: "Please enter a code" });
      return;
    }

    setCodeLoading(true);
    setCodeMessage(null);

    try {
      // --- [FIX] Add cache-busting parameter ---
      const response = await fetch(`/api/credits/redeem-code?_=${new Date().getTime()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeMessage({ type: "success", text: data.message });
        setCodeInput("");
        // --- [FIX] Reload data after successful redemption ---
        await loadData();
      } else {
        setCodeMessage({ type: "error", text: data.error || "Failed to redeem code" });
      }
    } catch (error) {
      console.error("Failed to redeem code", error);
      setCodeMessage({ type: "error", text: "Failed to redeem code. Please try again." });
    } finally {
      setCodeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">Sourcing Credits</h1>
          <p className="mt-1 text-[14px] text-slate-600">
            Manage your balance and verification history
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <HelpCircle className="w-4 h-4" />
          <span>Each verification requires 1 credit ($45)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance & Top-up */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="rounded-2xl bg-slate-900 text-white p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-[13px] text-slate-400 uppercase tracking-widest font-bold mb-4">
                Available Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${balanceInDollars}</span>
                <span className="text-slate-400 font-medium">USD</span>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Credits</p>
                  <p className="text-xl font-bold">{balance}</p>
                </div>
                <button
                  onClick={() => alert("Payment gateway connecting...")}
                  className="flex-1 h-14 bg-white text-slate-900 rounded-xl font-bold text-[15px] hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  Add Credit ($45)
                </button>
              </div>
            </div>
          </div>

          {/* Redeem Code */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-50">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">Have a promo code?</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setCodeMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !codeLoading) {
                    handleRedeemCode();
                  }
                }}
                placeholder="ENTER CODE (E.G. ATMNX)"
                className="flex-1 h-12 px-4 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase placeholder:text-slate-300"
                disabled={codeLoading}
              />
              <button
                onClick={handleRedeemCode}
                disabled={codeLoading || !codeInput.trim()}
                className="px-8 h-12 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {codeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Redeem"}
              </button>
            </div>
            {codeMessage && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl ${
                codeMessage.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                  : "bg-red-50 text-red-800 border border-red-100"
              }`}>
                {codeMessage.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <p className="text-sm font-medium">{codeMessage.text}</p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-900">Transaction History</h2>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[14px] text-slate-500 font-medium">No activity yet</p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Your credit usage and grants will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {transactions.map((tx) => {
                  const config = transactionTypeConfig[tx.type] || transactionTypeConfig.adjustment;
                  const Icon = config.icon;
                  const isPositive = tx.amount > 0;
                  const amountInDollars = Math.abs(tx.amount) * CREDIT_VALUE;

                  return (
                    <div key={tx.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{config.label}</p>
                          <p className="text-[12px] text-slate-400 font-medium">{formatDate(tx.created_at)}</p>
                          {tx.description && (
                            <p className="text-[12px] text-slate-500 mt-0.5">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[15px] font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                          {isPositive ? "+" : "-"}${amountInDollars}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          {tx.balance_after} Credits
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info/FAQ */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-200">
            <h3 className="text-[16px] font-bold mb-4">Verification Guarantee</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed">
                  <strong>100% Credited Back</strong>: Your $45 deposit is applied to your first order with the factory.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed">
                  <strong>Direct Access</strong>: We bypass intermediaries to find factories with 15-20% better pricing tiers.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed">
                  <strong>No Expiry</strong>: Your credits never expire and can be used for any future product.
                </p>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h4 className="text-[14px] font-bold text-slate-900 mb-2">Need help?</h4>
            <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">
              If you have questions about your balance or large-scale sourcing needs, contact our support team.
            </p>
            <button className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 hover:bg-white/50 transition-all">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  );
}

