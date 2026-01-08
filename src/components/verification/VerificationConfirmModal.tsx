"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { getMyCredits } from "@/server/actions/credits";

const CREDIT_VALUE = 49;

interface VerificationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function VerificationConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: VerificationConfirmModalProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoadingBalance(true);
      getMyCredits().then((result) => {
        setBalance(result.balance ?? 0);
        setLoadingBalance(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const balanceInDollars = (balance ?? 0) * CREDIT_VALUE;
  const hasEnoughBalance = (balance ?? 0) >= 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900">
              Confirm Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-[14px] text-slate-600">
            Starting verification will deduct <span className="font-bold text-slate-900">${CREDIT_VALUE}</span> from your balance.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-slate-500">Verification cost</span>
              <span className="text-[14px] font-bold text-slate-900">-${CREDIT_VALUE}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[13px] text-slate-500">Your current balance</span>
              {loadingBalance ? (
                <span className="text-[14px] text-slate-400">Loading...</span>
              ) : (
                <span className={`text-[14px] font-bold ${hasEnoughBalance ? "text-emerald-600" : "text-red-600"}`}>
                  ${balanceInDollars}
                </span>
              )}
            </div>
            {!loadingBalance && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
                <span className="text-[13px] text-slate-500">After verification</span>
                <span className={`text-[14px] font-bold ${hasEnoughBalance ? "text-slate-900" : "text-red-600"}`}>
                  ${Math.max(0, balanceInDollars - CREDIT_VALUE)}
                </span>
              </div>
            )}
          </div>

          {!loadingBalance && !hasEnoughBalance && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-[13px] text-red-700">
                <span className="font-medium">Insufficient balance.</span> You need at least ${CREDIT_VALUE} to start verification.
              </p>
            </div>
          )}

          <p className="text-[13px] text-slate-500">
            We'll start supplier outreach within 12 hours. You'll receive quotes with MOQ, lead time, and pricing within a week.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-10 px-4 bg-slate-100 text-slate-700 text-[14px] font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || loadingBalance || !hasEnoughBalance}
            className="flex-1 h-10 px-4 bg-slate-900 text-white text-[14px] font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Starting..." : `Confirm & Pay $${CREDIT_VALUE}`}
          </button>
        </div>
      </div>
    </div>
  );
}
