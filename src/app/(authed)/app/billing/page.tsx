"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, Gift, RefreshCw, HelpCircle } from "lucide-react";
import { fetchMyCredits, fetchMyCreditTransactions } from "./actions";
import type { CreditTransaction } from "@/server/actions/credits";

const CREDIT_VALUE = 45; // $45 per credit

const transactionTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  monthly_grant: { label: "Monthly bonus", icon: Gift, color: "text-emerald-600" },
  admin_grant: { label: "Balance added", icon: ArrowUpRight, color: "text-emerald-600" },
  verification_used: { label: "Verification", icon: ArrowDownRight, color: "text-red-600" },
  refund: { label: "Refund", icon: RefreshCw, color: "text-blue-600" },
  adjustment: { label: "Adjustment", icon: RefreshCw, color: "text-slate-600" },
};

export default function BillingPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-[28px] font-bold text-slate-900">Billing</h1>
        <p className="mt-2 text-[14px] text-slate-600">
          Manage your balance and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-slate-300 uppercase tracking-wide font-medium mb-2">
              Available Balance
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-medium text-slate-400">$</span>
              <span className="text-[48px] font-bold">{balanceInDollars}</span>
            </div>
            <p className="text-[14px] text-slate-400 mt-2">
              {balance} verification{balance !== 1 ? "s" : ""} available
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/10">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center gap-2 text-[13px] text-slate-300">
            <Gift className="w-4 h-4" />
            <span>$45 free every month</span>
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
                <span>Each verification costs <strong>$45</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>You receive <strong>$45 free every month</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Add funds via bank transfer or card</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Unused balance carries over</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Funds CTA */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Need to add funds?</h3>
            <p className="text-[14px] text-slate-600 mt-1">
              Contact us to top up your account balance
            </p>
          </div>
          <a
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[14px] font-medium rounded-full hover:bg-slate-800 transition-colors"
          >
            Contact Support
          </a>
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
                      Balance: ${balanceAfterInDollars}
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

