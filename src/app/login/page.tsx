"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/analyze";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          router.push(next);
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Check if email confirmation is required
          if (data.user.identities && data.user.identities.length === 0) {
            setError("An account with this email already exists. Please sign in instead.");
            setMode("signin");
          } else {
            router.push(next);
            router.refresh();
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-100/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </h1>
            <p className="text-sm text-slate-600">
              {mode === "signin"
                ? "Welcome back! Sign in to continue."
                : "Create an account to get started."}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-slate-200/80 bg-white/90 backdrop-blur rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 disabled:opacity-50 transition-all shadow-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-2.5 border border-slate-200/80 bg-white/90 backdrop-blur rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 disabled:opacity-50 transition-all shadow-sm"
                placeholder="••••••••"
              />
              {mode === "signup" && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-200/50 transition-all"
            >
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="mx-4 text-xs text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <Button
            variant="outline"
            onClick={handleSignInWithGoogle}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold border-slate-200/80 shadow-sm"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.578 12.27c0-.79-.07-1.54-.2-2.27h-9.78v4.28h5.58a4.8 4.8 0 01-2.08 3.18v2.78h3.57c2.08-1.92 3.28-4.72 3.28-8Z"
                fill="#4285F4"
              />
              <path
                d="M12.598 22.5c3.24 0 5.95-1.08 7.93-2.92l-3.57-2.78c-1.08.72-2.45 1.15-4.36 1.15-3.35 0-6.18-2.26-7.2-5.28H1.7v2.87A8.96 8.96 0 0012.6 22.5Z"
                fill="#34A853"
              />
              <path
                d="M5.398 14.25a5.32 5.32 0 010-3.5V7.88H1.7a8.96 8.96 0 000 8.24l3.7-2.87Z"
                fill="#FBBC05"
              />
              <path
                d="M12.598 4.5c1.75 0 3.35.6 4.6 1.8l3.16-3.15A8.93 8.93 0 0012.6 1.5c-4.42 0-8.13 2.87-9.9 6.75l3.7 2.87c1.02-3.02 3.85-5.28 7.2-5.28Z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

