"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("[Report V2 Error Boundary] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6">
          An error occurred while loading the report. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-block bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Try again
          </button>
          <a
            href="/app/reports"
            className="inline-block bg-slate-100 text-slate-900 rounded-full px-6 py-3 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Back to Reports
          </a>
        </div>
        {process.env.NODE_ENV !== "production" && error.message && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-slate-500 cursor-pointer">Error details</summary>
            <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

