"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  DollarSign,
  FileText,
  FolderKanban,
  Inbox,
  HelpCircle,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { signOut } from "@/app/actions/auth";
import type { User } from "@supabase/supabase-js";

const navConfig = {
  public: {
    primary: [
      { href: "/", label: "Home", icon: Home },
      { href: "/analyze", label: "Analyze", icon: Search },
      { href: "/pricing", label: "Pricing", icon: DollarSign },
    ],
    secondary: [] as any[],
  },
  app: {
    primary: [
      { href: "/app/analyze", label: "Analyze", icon: Search },
      { href: "/app/reports", label: "Reports", icon: FileText },
      { href: "/app/orders", label: "Orders", icon: FolderKanban },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
    ],
    secondary: [
      { href: "/admin", label: "Admin", icon: ShieldCheck, role: "OWNER" },
      { href: "/app/help", label: "Help", icon: HelpCircle },
      { action: "signout", label: "Sign out", icon: LogIn },
    ],
  },
};

interface TopNavProps {
  variant: "public" | "app";
  user: User | null;
}

export function TopNav({ variant, user }: TopNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = navConfig[variant].primary;
  const secondaryItems = navConfig[variant].secondary;
  const navRef = useRef<HTMLElement>(null);

  // Measure header height and set CSS variable
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateHeight = () => {
      const height = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--siteHeaderH", `${height}px`);
    };

    // Initial measurement
    updateHeight();

    // Watch for resize
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(nav);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <nav ref={navRef} className="border-b border-slate-200 bg-white sticky top-0 z-50" data-home-chrome="true">
      <div className="mx-auto max-w-[1040px] px-4 sm:px-6 h-[var(--topbar-h)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-full">
          <Link href={variant === "public" ? "/" : "/app"} className="text-xl font-bold text-electric-blue-600 shrink-0">
            <span>NexSupply</span>
          </Link>
          
          <div className="flex items-center gap-1 overflow-x-auto max-md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "text-electric-blue-600 border-b-2 border-electric-blue-600"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden justify-self-center">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
            >
              Menu
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-self-end">
            {/* Secondary dropdown */}
            {secondaryItems.length > 0 && (
              <details className="relative">
                <summary className="list-none flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer rounded-lg border border-slate-200">
                  More
                </summary>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {secondaryItems.map((item) => {
                      if (item.role && item.role !== (user as any)?.app_metadata?.role && item.role !== (user as any)?.user_metadata?.role) {
                        return null;
                      }
                      if (item.action === "signout") {
                        if (!user) return null;
                        const Icon = item.icon;
                        return (
                          <form key={item.label} action={signOut}>
                            <button
                              type="submit"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Icon className="w-4 h-4" /> {item.label}
                            </button>
                          </form>
                        );
                      }
                      const Icon = item.icon;
                      const isActive = pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${isActive ? "text-electric-blue-600" : "text-slate-700"}`}
                        >
                          <Icon className="w-4 h-4" /> {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </details>
            )}

            {!user && (
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-electric-blue-600 rounded-lg hover:bg-electric-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 pt-2 pb-3 space-y-1">
            {[...navItems, ...secondaryItems.filter((item) => !item.role || item.role === (user as any)?.app_metadata?.role || item.role === (user as any)?.user_metadata?.role)].map((item) => {
              if (item.action === "signout") {
                if (!user) return null;
                const Icon = item.icon;
                return (
                  <form key={item.label} action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Icon className="w-4 h-4" /> {item.label}
                    </button>
                  </form>
                );
              }
              const Icon = item.icon;
              const isActive = item.href ? pathname?.startsWith(item.href) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${isActive ? "text-electric-blue-600" : "text-slate-700"} hover:bg-slate-50`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

