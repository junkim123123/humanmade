"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileText,
  HelpCircle,
  LogIn,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  User as UserIcon,
  UserPlus,
  X,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  icon?: ComponentType<{ className?: string }>;
  badge?: number;
  onClick?: () => void;
}

export function NavItem({ href, label, active, icon: Icon, badge, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface UserMenuProps {
  user: SupabaseUser | null;
  showBilling?: boolean;
}

export function UserMenu({ user, showBilling = true }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = useMemo(() => {
    if (!user?.email) return "N";
    return user.email.charAt(0).toUpperCase();
  }, [user?.email]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        aria-label="Open user menu"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-200/60"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{user?.email ?? "Account"}</p>
            <p className="text-xs text-slate-500">Manage your workspace</p>
          </div>
          <div className="py-1" aria-label="User menu">
            <Link
              href="/app/account"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <UserIcon className="h-4 w-4" /> Account
            </Link>
            {showBilling && (
              <Link
                href="/app/billing"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <CreditCard className="h-4 w-4" /> Billing
              </Link>
            )}
            <Link
              href="/support"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <HelpCircle className="h-4 w-4" /> Support
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck className="h-4 w-4" /> Privacy
            </Link>
            <form action={signOut} role="none">
              <button
                type="submit"
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <LogIn className="h-4 w-4 rotate-180" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function useHeaderHeight(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const updateHeight = () => {
      const height = node.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--siteHeaderH", `${height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  const cleanHref = href.split("#")[0];
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

interface PublicNavbarProps {
  user?: SupabaseUser | null;
}

export function PublicNavbar({ user }: PublicNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useHeaderHeight(navRef);

  const navItems = useMemo(
    () => [
      { href: "/analyze", label: "Free Analyze" },
      { href: "/pricing", label: "Pricing" },
      { href: "/sample-report", label: "Sample Report" },
      { href: "/proof", label: "Proof" },
    ],
    []
  );

  const isLoggedIn = !!user;

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-slate-900" aria-label="NexSupply home">
            NexSupply
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Go to App
              </Link>
            ) : (
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={isActive(pathname, item.href)}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
              <div className="mt-2">
                {isLoggedIn ? (
                  <Link
                    href="/app"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to App
                  </Link>
                ) : (
                  <Link
                    href="/signin"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

interface AppNavbarProps {
  user: SupabaseUser;
  needsAttentionCount?: number;
  showBilling?: boolean;
}

export function AppNavbar({ user, needsAttentionCount = 0, showBilling = true }: AppNavbarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  useHeaderHeight(navRef);

  const navItems = useMemo(
    () => [
      { href: "/app/analyze", label: "Free Analyze", icon: Search },
      { href: "/app/reports", label: "Blueprint", icon: FileText },
      { href: "/app/orders", label: "Execute", icon: ShoppingBag, badge: needsAttentionCount },
    ],
    [needsAttentionCount]
  );

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-lg font-semibold text-slate-900" aria-label="NexSupply app home">
            NexSupply
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/analyze"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Plus className="h-4 w-4" />
            New analysis
          </Link>
          <UserMenu user={user} showBilling={showBilling} />
        </div>
      </div>
    </nav>
  );
}

export function TopNav({ variant, user }: { variant: "public" | "app"; user: SupabaseUser | null }) {
  if (variant === "app") {
    return user ? <AppNavbar user={user} /> : null;
  }
  return <PublicNavbar user={user} />;
}

