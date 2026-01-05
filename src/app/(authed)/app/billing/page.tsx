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

  useEffect(() => {
    async function loadData() {
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
    }
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
      const response = await fetch("/api/credits/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeMessage({ type: "success", text: data.message });
        setCodeInput("");
        // Reload credits and transactions
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
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Sourcing Credits</h1>
        <p className="mt-2 text-[14px] text-slate-600">
          Manage your credits and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-slate-300 uppercase tracking-wide font-medium mb-2">
              Available Credits
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-medium text-slate-400">$</span>
              <span className="text-[48px] font-bold">{balanceInDollars}</span>
            </div>
            <p className="text-[14px] text-slate-400 mt-2">
              {balance} Credit{balance !== 1 ? "s" : ""} Available
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/10">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-slate-100">
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 mb-2">How it works</h2>
            <ul className="space-y-2 text-[14px] text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Each verification requires a <strong>$45 deposit</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>This deposit is <strong>100% credited back</strong> to you when you place an order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Credits never expire</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Redeem Code Section */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Gift className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-slate-900 mb-1">Redeem Code</h3>
            <p className="text-[13px] text-slate-600">
              Enter a code to add $45 credit to your account
            </p>
          </div>
        </div>
        <div className="space-y-3">
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
              placeholder="Enter code (e.g. ATMNX)"
              className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all uppercase"
              disabled={codeLoading}
            />
            <button
              onClick={handleRedeemCode}
              disabled={codeLoading || !codeInput.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {codeLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Redeem
                </>
              )}
            </button>
          </div>
          {codeMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              codeMessage.type === "success" 
                ? "bg-emerald-50 border border-emerald-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              {codeMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${
                codeMessage.type === "success" ? "text-emerald-800" : "text-red-800"
              }`}>
                {codeMessage.text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Credit CTA */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Add Credit</h3>
            <p className="text-[14px] text-slate-600 mt-1">
              Purchase a $45 credit to start verification
            </p>
          </div>
          <button
            onClick={() => {
              alert("Payment gateway connecting...");
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[15px] font-semibold rounded-full hover:bg-slate-800 transition-colors"
          >
            Add Credit ($45)
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-[16px] font-semibold text-slate-900">Transaction History</h2>
          <p className="text-[13px] text-slate-500 mt-1">Your balance changes</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-[14px] text-slate-500">No transactions yet</p>
            <p className="text-[13px] text-slate-400 mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const config = transactionTypeConfig[tx.type] || transactionTypeConfig.adjustment;
              const Icon = config.icon;
              const isPositive = tx.amount > 0;
              const amountInDollars = Math.abs(tx.amount) * CREDIT_VALUE;
              const balanceAfterInDollars = tx.balance_after * CREDIT_VALUE;

              return (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-slate-900">{config.label}</p>
                      <p className="text-[12px] text-slate-400">{formatDate(tx.created_at)}</p>
                      {tx.description && (
                        <p className="text-[12px] text-slate-500 mt-0.5">{tx.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[16px] font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                      {isPositive ? "+" : "-"}${amountInDollars}
                    </p>
                    <p className="text-[12px] text-slate-400">
                      Credits: ${balanceAfterInDollars}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

