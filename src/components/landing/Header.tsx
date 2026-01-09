"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="text-2xl font-bold text-electric-blue-600">NexSupply</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              href="/reports/sample"
              className="text-sm font-medium text-slate-700 hover:text-electric-blue-600 transition-colors"
            >
              Sample report
            </Link>
            <Link
              href="/proof"
              className="text-sm font-medium text-slate-700 hover:text-electric-blue-600 transition-colors"
            >
              Proof
            </Link>
            <Link
              href="/signin"
              className="text-sm font-medium text-slate-700 hover:text-electric-blue-600 transition-colors"
            >
              Sign in
            </Link>
            <a
              href="https://wa.me/13146577892"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-electric-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-electric-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

