import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/account/AccountSettings";
import { getMyProfile, UserProfile } from "@/server/actions/profile";
import { getMyCredits } from "@/server/actions/credits";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/app/account");
  }

  const [profileResult, creditsResult] = await Promise.all([
    getMyProfile(),
    getMyCredits(),
  ]);

  const profile = profileResult.profile;
  const balance = creditsResult.balance ?? 0;
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-6">
            Account
          </h1>

          <AccountSettings 
            email={user.email || ""} 
            userId={user.id} 
            isAdmin={isAdmin}
            profile={profile}
            balance={balance}
          />
        </div>
      </div>
    </div>
  );
}
