"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { SignOutButton } from "@/components/SignOutButton";
import { updateProfile, updateNotificationSettings, UserProfile } from "@/server/actions/profile";
import Link from "next/link";

const CREDIT_VALUE = 45;

interface AccountSettingsProps {
  email: string;
  userId: string;
  isAdmin?: boolean;
  adminHref?: string;
  profile?: UserProfile | null;
  balance?: number;
}

export function AccountSettings({ 
  email, 
  userId, 
  isAdmin = false, 
  adminHref = "/admin",
  profile,
  balance = 0,
}: AccountSettingsProps) {
  // Password section
  const [securityOpen, setSecurityOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile section
  const [profileOpen, setProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications section
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifyQuotes, setNotifyQuotes] = useState(profile?.notify_quotes_ready ?? true);
  const [notifyOrders, setNotifyOrders] = useState(profile?.notify_order_updates ?? true);
  const [notifyCredits, setNotifyCredits] = useState(profile?.notify_monthly_credits ?? true);
  const [notifyMarketing, setNotifyMarketing] = useState(profile?.notify_marketing ?? false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Company/Shipping section
  const [companyOpen, setCompanyOpen] = useState(false);
  const [addressLine1, setAddressLine1] = useState(profile?.shipping_address_line1 || "");
  const [addressLine2, setAddressLine2] = useState(profile?.shipping_address_line2 || "");
  const [city, setCity] = useState(profile?.shipping_city || "");
  const [state, setState] = useState(profile?.shipping_state || "");
  const [postalCode, setPostalCode] = useState(profile?.shipping_postal_code || "");
  const [country, setCountry] = useState(profile?.shipping_country || "United States");
  const [taxId, setTaxId] = useState(""); // EIN / Tax ID (placeholder for future DB field)
  const [savingCompany, setSavingCompany] = useState(false);

  const canSave = useMemo(() => {
    if (!password || !confirm) return false;
    if (password.length < 6) return false;
    if (password !== confirm) return false;
    return true;
  }, [password, confirm]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      toast.success("User ID copied");
    } catch (_err) {
      toast.error("Failed to copy");
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !canSave) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Could not update password");
      toast.error("Could not update password");
    } else {
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
      setSecurityOpen(false);
    }
    setSaving(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile({
      full_name: fullName || null,
      company_name: companyName || null,
      phone: phone || null,
    });
    if (result.success) {
      toast.success("Profile updated");
      setProfileOpen(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setSavingProfile(false);
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    const result = await updateNotificationSettings({
      notify_quotes_ready: notifyQuotes,
      notify_order_updates: notifyOrders,
      notify_monthly_credits: notifyCredits,
      notify_marketing: notifyMarketing,
    });
    if (result.success) {
      toast.success("Notification preferences saved");
      setNotificationsOpen(false);
    } else {
      toast.error(result.error || "Failed to save preferences");
    }
    setSavingNotifications(false);
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    const result = await updateProfile({
      shipping_address_line1: addressLine1 || null,
      shipping_address_line2: addressLine2 || null,
      shipping_city: city || null,
      shipping_state: state || null,
      shipping_postal_code: postalCode || null,
      shipping_country: country || null,
    });
    if (result.success) {
      toast.success("Company info updated");
      setCompanyOpen(false);
    } else {
      toast.error(result.error || "Failed to update company info");
    }
    setSavingCompany(false);
  };

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 6;

  const balanceInDollars = balance * CREDIT_VALUE;

  return (
    <div className="space-y-8">
      {/* Account Email Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Account</h2>
            <p className="text-sm text-slate-600">Email on your account</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
          {email}
        </div>
        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </section>

      {/* Billing Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">💳 Billing</h3>
            <p className="text-sm text-slate-600">
              Available Credits: <span className="font-semibold text-emerald-600">${balanceInDollars}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Credits from your deposits are applied to future execution fees.
            </p>
          </div>
          <Link
            href="/app/billing"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Manage billing →
          </Link>
        </div>
      </section>

      {/* Profile Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">👤 Profile</h3>
            <p className="text-sm text-slate-600">
              {profile?.full_name || profile?.company_name 
                ? `${profile.full_name || ""}${profile.full_name && profile.company_name ? " · " : ""}${profile.company_name || ""}`
                : "Add your name and company"
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {profileOpen ? "Hide" : "Edit"}
          </button>
        </div>

        {profileOpen && (
          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Full name
              <input
                type="text"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Company name
              <input
                type="text"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Phone number
              <input
                type="tel"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notifications Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">🔔 Notifications</h3>
            <p className="text-sm text-slate-600">Email notification preferences</p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {notificationsOpen ? "Hide" : "Configure"}
          </button>
        </div>

        {notificationsOpen && (
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-900">Quotes ready</div>
                <div className="text-xs text-slate-500">Get notified when supplier quotes are ready</div>
              </div>
              <input
                type="checkbox"
                checked={notifyQuotes}
                onChange={(e) => setNotifyQuotes(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-900">Order updates</div>
                <div className="text-xs text-slate-500">Get notified about order status changes</div>
              </div>
              <input
                type="checkbox"
                checked={notifyOrders}
                onChange={(e) => setNotifyOrders(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-900">Monthly credits</div>
                <div className="text-xs text-slate-500">Get notified when free credits are added</div>
              </div>
              <input
                type="checkbox"
                checked={notifyCredits}
                onChange={(e) => setNotifyCredits(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-900">Marketing & updates</div>
                <div className="text-xs text-slate-500">Receive news and feature announcements</div>
              </div>
              <input
                type="checkbox"
                checked={notifyMarketing}
                onChange={(e) => setNotifyMarketing(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNotifications ? "Saving..." : "Save preferences"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Import Settings Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">🏢 Import Settings</h3>
            <p className="text-sm text-slate-600">
              {profile?.shipping_city && profile?.shipping_country
                ? `${profile.shipping_city}, ${profile.shipping_state || ""} ${profile.shipping_country}`
                : "Shipping Address and EIN / Tax ID required for Customs Clearance"
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCompanyOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {companyOpen ? "Hide" : "Edit"}
          </button>
        </div>

        {companyOpen && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-2">
              <p className="text-xs text-blue-800 font-medium">
                Required for Customs Clearance: Shipping Address and EIN / Tax ID
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Shipping Address</h4>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Address line 1
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main Street"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Address line 2
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite 100 (optional)"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  City
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  State / Province
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Postal code
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Country
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900">Tax Information</h4>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                EIN / Tax ID
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="12-3456789"
                />
                <p className="text-xs text-slate-500 mt-1">Required for US Customs clearance</p>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveCompany}
                disabled={savingCompany}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCompany ? "Saving..." : "Save import settings"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sourcing Support Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">💬 Sourcing Support</h3>
            <p className="text-sm text-slate-600">Get help with sourcing questions or issues</p>
          </div>
          <Link
            href="/support"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Contact Support →
          </Link>
        </div>
      </section>

      {/* Password Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">🔐 Password login</h3>
            <p className="text-sm text-slate-600">Use a password to sign in without email links</p>
          </div>
          <button
            type="button"
            onClick={() => setSecurityOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {securityOpen ? "Hide" : "Enable password login"}
          </button>
        </div>

        {securityOpen && (
          <form onSubmit={handleSave} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                New password
                <input
                  type="password"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {tooShort && <span className="text-xs text-amber-700">Password must be at least 6 characters</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Confirm
                <input
                  type="password"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                {mismatch && <span className="text-xs text-amber-700">Passwords do not match</span>}
              </label>
            </div>
            {error && <p className="text-sm text-amber-700">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canSave || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save password"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Advanced Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">⚙️ Advanced</h3>
            <p className="text-sm text-slate-600">For troubleshooting only</p>
          </div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {advancedOpen ? "Hide" : "Show"}
          </button>
        </div>
        {advancedOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-600">User ID</div>
                <div className="font-mono text-sm text-slate-800 truncate" title={userId}>{userId}</div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                Copy
              </button>
            </div>
            {isAdmin && (
              <a
                href={adminHref}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Go to Admin Panel →
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
