import React from "react";

export default function AdminCreditsPage() {
  const handleGrantCredits = async () => {
    try {
      const finalCredits = Math.round(dollarAmount / CREDIT_VALUE) * (isAdding ? 1 : -1);
      if (!selectedUser || finalCredits === 0) return;
      setIsGranting(true);
      const res = await adminGrantCredits(selectedUser.user_id, finalCredits, description);
      if (res.success) {
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
      return (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Users Table */}
          <Card className="overflow-hidden">
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
                            {/* ...existing code... */}
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
          </Card>

          {/* Modal block as sibling, not inside Card */}
          {showModal && (
            <div className="flex gap-2 mt-6">
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
          )}
        </>
      );
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
                            </div>
                          </Card>
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No users found
        </div>
      )}
                  {/* Modal block as sibling, not as child */}
                  {showModal && (

                    <div className="flex gap-2 mt-6">
