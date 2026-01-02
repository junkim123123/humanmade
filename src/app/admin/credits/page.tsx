import AdminCreditsClient from "./AdminCreditsClient";
import { adminGetAllUserCredits } from "@/server/actions/credits";

export default async function AdminCreditsPage() {
  const res = await adminGetAllUserCredits();
  const users = res.success ? res.users || [] : [];
  return <AdminCreditsClient users={users} />;
}
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
