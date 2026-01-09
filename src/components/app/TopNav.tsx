"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { buildAppNav, type UserRole } from "@/lib/nav";
import UserMenu from "@/components/app/UserMenu";
import { signOut } from "@/app/actions/auth";

export default function TopNav({ role = "VIEWER" }: { role?: UserRole }) {
  const pathname = usePathname();
  const { primary, secondary } = buildAppNav(role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Measure header height and set CSS variable
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateHeight = () => {
      const height = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--siteHeaderH", `${height}px`);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(nav);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav ref={navRef} className="w-full border-b border-slate-200 bg-white sticky top-0 z-50" data-home-chrome="true">
      <div className="mx-auto max-w-[1040px] px-4 sm:px-6 h-[var(--topbar-h)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-full">
          {/* Logo */}
          <Link href="/app/reports" className="text-xl font-bold text-electric-blue-600 shrink-0">
            NexSupply
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {primary.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-electric-blue-600 border-b-2 border-electric-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-center">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right Side - User Menu or Sign Out */}
          <div className="flex items-center gap-2 shrink-0 justify-self-end">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-col gap-1">
            {primary.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-electric-blue-50 text-electric-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-1 border-t border-slate-200 pt-1">
              {secondary.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
