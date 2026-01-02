"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wallet, Plus, Minus, Search, RefreshCw, DollarSign } from "lucide-react";
import { adminGetAllUserCredits, adminGrantCredits } from "@/server/actions/credits";

const CREDIT_VALUE = 45; // $45 per credit

interface UserCredits {
  user_id: string;
  email: string;
  credits_balance: number;
  updated_at: string | null;
}

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<UserCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCredits | null>(null);
  const [dollarAmount, setDollarAmount] = useState<number>(45);
  const [description, setDescription] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminGetAllUserCredits();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Total balance in dollars
  const totalBalanceDollars = users.reduce((sum, u) => sum + u.credits_balance, 0) * CREDIT_VALUE;

  const handleGrantCredits = async () => {
    if (!selectedUser || dollarAmount === 0) return;
    
    // Convert dollars to credits (round to nearest credit)
    const credits = Math.round(dollarAmount / CREDIT_VALUE);
    if (credits === 0) {
      alert("Amount must be at least $45");
      return;
    }
    
    const finalCredits = isAdding ? credits : -credits;
    
    setIsGranting(true);
    try {
      const res = await adminGrantCredits(selectedUser.user_id, finalCredits, description);
      if (res.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === selectedUser.user_id
              ? { ...u, credits_balance: res.newBalance ?? u.credits_balance + finalCredits }
              : u
          )
        );
        setShowModal(false);
        setSelectedUser(null);
        setDollarAmount(45);
        setDescription("");
      } else {
        alert(res.error || "Failed to update balance");
      }
    } catch (err) {
      console.error("Failed to update balance", err);
      alert("Failed to update balance");
    } finally {
      setIsGranting(false);
    }
  };

  const openGrantModal = (user: UserCredits, adding: boolean) => {
    setSelectedUser(user);
    setIsAdding(adding);
    setDollarAmount(45);
    setDescription("");
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Balance Management</h1>
        <p className="text-slate-600 mt-2">Add or remove funds from user accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-100">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500">Total Balance Issued</p>
              <p className="text-2xl font-bold text-slate-900">
                ${totalBalanceDollars.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-100">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500">Users with Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter((u) => u.credits_balance > 0).length}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Verifications
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const balanceInDollars = user.credits_balance * CREDIT_VALUE;
                return (
                  <tr key={user.user_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        user.credits_balance > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        ${balanceInDollars}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {user.credits_balance} available
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openGrantModal(user, true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add $
                        </button>
                        {user.credits_balance > 0 && (
                          <button
                            onClick={() => openGrantModal(user, false)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No users found
            </div>
          )}
        </div>
      {/* Card 닫는 태그 제거: 빌드 에러 수정 */}

      {/* Grant Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-[18px] font-bold text-slate-900 mb-4">
              {isAdding ? "Add Funds" : "Remove Funds"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-[13px] text-slate-500 mb-1">User</p>
                <p className="text-[14px] font-medium text-slate-900">{selectedUser.email}</p>
                <p className="text-[12px] text-slate-400">Current balance: ${selectedUser.credits_balance * CREDIT_VALUE}</p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                  Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="45"
                    min="45"
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[12px] text-slate-400 mt-1">
                  = {Math.round(dollarAmount / CREDIT_VALUE)} verification{Math.round(dollarAmount / CREDIT_VALUE) !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[45, 90, 135, 225, 450].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDollarAmount(amt)}
                    className={`flex-1 py-2 text-[12px] font-medium rounded-lg border transition-colors ${
                      dollarAmount === amt
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Bank transfer received, Promotional credit"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 px-4 bg-slate-100 text-slate-700 text-[14px] font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantCredits}
                disabled={isGranting || dollarAmount < 45}
                className={`flex-1 h-10 px-4 text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  isAdding
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isGranting ? "Processing..." : isAdding ? `Add $${dollarAmount}` : `Remove $${dollarAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
