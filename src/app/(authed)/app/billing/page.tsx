"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, HelpCircle, Gift, Check, X, ShieldCheck, Plus } from "lucide-react";
import { fetchMyCredits, fetchMyCreditTransactions } from "./actions";
import type { CreditTransaction } from "@/server/actions/credits";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CREDIT_VALUE = 49; // $49 per credit

const transactionTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  admin_grant: { label: "Credit added", icon: ArrowUpRight, color: "text-emerald-600" },
  monthly_grant: { label: "Monthly grant", icon: ArrowUpRight, color: "text-emerald-600" },
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
  const [showPromo, setShowPromo] = useState(false);
  const [topupStatus, setTopupStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [topupMessage, setTopupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Convert credits to dollar amount
  const balanceInDollars = balance * CREDIT_VALUE;

  const usedCredits = transactions
    .filter(tx => tx.type === 'verification_used')
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const processingCredits = transactions.filter(tx => tx.type === 'admin_grant' && tx.description?.toLowerCase().includes('pending')).length;
  const lifetimeUsed = usedCredits;

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

  const handleManualTopupRequest = async () => {
    if (topupStatus === "loading") {
      return;
    }

    setTopupStatus("loading");
    setTopupMessage(null);

    try {
      const response = await fetch("/api/credits/manual-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsRequested: 1 }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request");
      }

      setTopupStatus("submitted");
      setTopupMessage({
        type: "success",
        text: data.message || "Request received. Manual top-up takes 3–6 hours.",
      });
    } catch (error) {
      console.error("Failed to submit manual top-up request", error);
      setTopupStatus("idle");
      setTopupMessage({ type: "error", text: "Failed to submit request. Please try again." });
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
    <div className="min-h-screen bg-white">
      {/* Hero Header - Matching Reports Page Consistency */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-12">
          <div className="text-center">
            <h1 className="text-[32px] sm:text-[40px] font-bold text-white leading-tight mb-3">
              Sourcing Credits
            </h1>
            <p className="text-[15px] text-slate-400 max-w-md mx-auto mb-6">
              1 credit = 1 product verification<br/>
              Deposit credited back on your first order<br/>
              No expiry
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Balance & Top-up */}
          <div className="lg:col-span-2 space-y-8">
            {/* Balance Card */}
            <div className="rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wallet className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[13px] text-slate-400 uppercase tracking-widest font-bold">
                    Available Balance
                  </p>
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold">
                    {balance} CREDITS
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-bold tracking-tight">{formatCurrency(balanceInDollars)}</span>
                  <span className="text-slate-400 font-medium text-xl uppercase">USD</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-slate-400 uppercase font-bold mb-1">Processing</p>
                    <p className="text-[18px] font-bold">{processingCredits} <span className="text-[12px] font-normal text-slate-500">Credits</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-slate-400 uppercase font-bold mb-1">Lifetime Used</p>
                    <p className="text-[18px] font-bold">{lifetimeUsed} <span className="text-[12px] font-normal text-slate-500">Credits</span></p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleManualTopupRequest}
                    disabled={topupStatus === "loading" || topupStatus === "submitted"}
                    className="w-full h-16 bg-white text-slate-900 rounded-2xl font-bold text-[18px] hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {topupStatus === "loading" ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {balance === 0 ? "Request Initial Credit (Free)" : "Request More Credits (Free)"}
                  </button>
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[12px] text-slate-400">1 credit = 1 product verification</p>
                    {balance === 0 && (
                      <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded animate-pulse">Required to start verification</span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-400 px-2">
                    Free during beta · Manual top-up takes 3–6 hours
                  </p>
                  {topupMessage && (
                    <div className={`mt-1 flex items-center gap-3 p-4 rounded-2xl ${
                      topupMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : "bg-red-50 text-red-800 border border-red-100"
                    }`}>
                      {topupMessage.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      <p className="text-[14px] font-semibold">{topupMessage.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Promo Code Toggle */}
            <div className="flex justify-center">
              <button 
                onClick={() => setShowPromo(!showPromo)}
                className="text-[13px] text-slate-400 font-medium hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                {showPromo ? "Hide promo code entry" : "Have a promo code?"}
              </button>
            </div>

            {/* Redeem Code - Collapsible */}
            {showPromo && (
              <Card className="p-8 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-blue-50">
                    <Gift className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900">Promo Code</h3>
                    <p className="text-[14px] text-slate-500">Credits will be added instantly upon redemption.</p>
                  </div>
                </div>
                <div className="flex gap-3">
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
                    placeholder="ENTER CODE"
                    className="flex-1 h-14 px-6 border-2 border-slate-100 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase placeholder:text-slate-300"
                    disabled={codeLoading}
                  />
                  <Button
                    onClick={handleRedeemCode}
                    disabled={codeLoading || !codeInput.trim()}
                    className="px-10 h-14 rounded-2xl text-base"
                  >
                    {codeLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {codeMessage && (
                  <div className={`mt-4 flex items-center gap-3 p-4 rounded-2xl ${
                    codeMessage.type === "success" 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                      : "bg-red-50 text-red-800 border border-red-100"
                  }`}>
                    {codeMessage.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    <p className="text-[14px] font-semibold">{codeMessage.text}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Transaction History */}
            <Card className="overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-[18px] font-bold text-slate-900">Transaction History</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-[13px] font-medium">Last 50 activities</span>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RefreshCw className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 mb-1">No transactions yet</h3>
                  <p className="text-[14px] text-slate-500 max-w-xs mx-auto">
                    Your credit usage and grants will be listed here automatically.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const config = transactionTypeConfig[tx.type] || transactionTypeConfig.adjustment;
                    const Icon = config.icon;
                    const isPositive = tx.amount > 0;
                    const amountInDollars = Math.abs(tx.amount) * CREDIT_VALUE;

                    return (
                      <div key={tx.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className={`p-3.5 rounded-2xl transition-transform group-hover:scale-110 ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-slate-900 leading-tight mb-1">{config.label}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-[13px] text-slate-400 font-medium">{formatDate(tx.created_at)}</p>
                              {tx.description && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <p className="text-[13px] text-slate-500">{tx.description}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[18px] font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {isPositive ? "+" : "-"}${amountInDollars}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {tx.balance_after} Credits
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Info/FAQ */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                <Check className="w-32 h-32" />
              </div>
              <h3 className="text-[18px] font-bold mb-6 relative z-10">Verification Support</h3>
              <ul className="space-y-6 relative z-10">
                <li className="flex items-start gap-4">
                  <div className="p-1 rounded-full bg-blue-500/50 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[14px] leading-relaxed">
                    <strong>100% Credited Back</strong><br/>
                    <span className="text-blue-100">Your $49 deposit is credited toward your first order within 60 days.</span>
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-1 rounded-full bg-blue-500/50 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[14px] leading-relaxed">
                    <strong>Direct Factory Access</strong><br/>
                    <span className="text-blue-100">We bypass intermediaries to find factories with 15-20% better pricing.</span>
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-1 rounded-full bg-blue-500/50 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[14px] leading-relaxed">
                    <strong>No Expiry</strong><br/>
                    <span className="text-blue-100">Your credits never expire and can be used for any future product.</span>
                  </p>
                </li>
              </ul>
            </div>

            <Card className="p-8 bg-slate-50 border-none shadow-none">
              <h4 className="text-[16px] font-bold text-slate-900 mb-3">Need help?</h4>
              <p className="text-[14px] text-slate-600 mb-6 leading-relaxed">
                If you have questions about your balance or large-scale sourcing needs, contact our support team.
              </p>
              <Button variant="outline" className="w-full rounded-2xl bg-white border-slate-200">
                Contact Support
              </Button>
            </Card>

            <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-50">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900">Secure Billing</p>
                <p className="text-[12px] text-slate-500">All transactions are encrypted and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
