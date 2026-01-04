"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Check, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not sign in with Google";
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
              <p className="text-[12px] font-medium uppercase tracking-widest text-slate-500">Sign in</p>
              <h1 className="text-[28px] font-bold text-slate-900">Welcome back</h1>
              <p className="text-[14px] text-slate-600">Sign in to save your sourcing reports and track verification.</p>
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
                onClick={handleGoogleSignIn}
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
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</span>
                ) : (
                  "Continue with Google"
                )}
              </button>

              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>or use email</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handlePasswordAuth} className="space-y-4">
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
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      disabled={loading}
                      className="w-full h-11 px-4 pr-11 border border-slate-200 bg-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition"
                      placeholder="Password"
                      autoComplete="current-password"
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
                  <div className="flex justify-between text-[13px] pt-1">
                    <span className="text-slate-500">Forgot your password? Reset anytime.</span>
                    <Link href="/forgot-password" className="text-slate-900 font-medium hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-medium rounded-full transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-[12px] text-slate-500">We keep your reports private and only share with you. Questions? Email support@nexsupply.com.</p>
                <p className="text-[12px] text-slate-500">By continuing, you agree to our <Link href="/terms" className="text-slate-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-slate-700 hover:underline">Privacy Policy</Link>.</p>
                <p className="text-[14px] text-slate-600">Need an account? <Link href="/signup" className="text-slate-900 font-medium hover:underline">Create one</Link>.</p>
              </form>
            </div>
          </div>

          {/* Right: Why sign in */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-5">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-widest text-slate-500">Why sign in</p>
              <h2 className="text-[22px] font-bold text-slate-900 mt-1">Save work, not just logins.</h2>
              <p className="text-[14px] text-slate-600 mt-1">Your sourcing intelligence OS — all your reports and decisions in one place.</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Save every report and revisit them anytime.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Keep your landed cost and HS decisions in one place.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] text-slate-700">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Request verification and track orders from a single dashboard.</span>
              </li>
            </ul>
            <p className="text-[12px] text-slate-500 pt-3 border-t border-slate-200">By signing in you agree to our <Link href="/terms" className="text-slate-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-slate-700 hover:underline">Privacy</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}
