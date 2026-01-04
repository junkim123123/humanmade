"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Check, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function SignUpPageContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handlePasswordSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setNotice("Check your email for a confirmation link.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/app`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign up failed";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[14px] text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] rounded-xl border border-slate-200 bg-white p-8">
          {/* Left: Form */}
          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <p className="text-[12px] font-medium uppercase tracking-widest text-slate-500">Create account</p>
              <h1 className="text-[28px] font-bold text-slate-900">Create account</h1>
              <p className="text-[14px] text-slate-600">Get a free NexSupply workspace for your sourcing reports.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[14px] text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[14px] text-emerald-700">
                {notice}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full h-11 px-4 flex items-center justify-center gap-2 text-[14px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing up...</span>
                ) : (
                  "Continue with Google"
                )}
              </button>

              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>or use email</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handlePasswordSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-11 px-4 border border-slate-200 bg-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full h-11 px-4 pr-11 border border-slate-200 bg-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                      aria-pressed={passwordVisible}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-slate-700">Confirm password</label>
                  <div className="relative">
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full h-11 px-4 pr-11 border border-slate-200 bg-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordVisible((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                      aria-pressed={confirmPasswordVisible}
                      aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                    >
                      {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-medium rounded-full transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                <p className="text-[12px] text-slate-500">Free forever — no credit card required.</p>
                <p className="text-[12px] text-slate-500">Save unlimited reports and verification history.</p>
                <p className="text-[12px] text-slate-500">Questions? Email support@nexsupply.com.</p>
                <p className="text-[12px] text-slate-500">By continuing, you agree to our <Link href="/terms" className="text-slate-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-slate-700 hover:underline">Privacy Policy</Link>.</p>
                <p className="text-[14px] text-slate-600">Already have an account? <Link href="/signin" className="text-slate-900 font-medium hover:underline">Sign in</Link>.</p>
              </form>
            </div>
          </div>

          {/* Right: Why create account */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-5">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-widest text-slate-500">Why create an account</p>
              <h2 className="text-[22px] font-bold text-slate-900 mt-1">Unlock full sourcing history.</h2>
              <p className="text-[14px] text-slate-600 mt-1">Build your sourcing intelligence OS — all your reports and decisions in one place.</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Save every report and revisit anytime.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Keep your reports private and under your control.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Request verification and track orders in one place.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Free forever — no credit card required.</span>
              </li>
            </ul>
            <p className="text-[12px] text-slate-500 pt-3 border-t border-slate-200">By signing up you agree to our <Link href="/terms" className="text-slate-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-slate-700 hover:underline">Privacy</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>}>
      <SignUpPageContent />
    </Suspense>
  );
}
