"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Search, FileText, FolderKanban, MoreHorizontal, MessageSquare, Settings, HelpCircle, LogOut } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

const primaryNavItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/analyze", label: "Analyze", icon: Search },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/projects", label: "Orders", icon: FolderKanban },
];

const moreNavItems = [
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/admin", label: "Admin", icon: Settings, requiresAdmin: true },
  { href: "/support", label: "Help", icon: HelpCircle },
  { href: "/support?category=technical_issues", label: "Technical Issues", icon: HelpCircle },
];

interface NavItem {
  href: string;
  label: string;
  icon: any;
  requiresAdmin?: boolean;
}

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
        ${
          isActive
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-slate-600 hover:text-slate-900"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function MoreDropdown({ pathname, userIsAdmin }: { pathname: string; userIsAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleItems = moreNavItems.filter(item => {
    if (item.requiresAdmin && !userIsAdmin) return false;
    return true;
  });

  return (
    <div className="relative group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="whitespace-nowrap">More</span>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-0 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 transition-all ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="py-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-1 border-t border-slate-100" />

          {/* Sign Out */}
          <div
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function PrimaryNav() {
  const pathname = usePathname();
  // TODO: Get user's admin status from context/session
  const userIsAdmin = true; // Placeholder - update with actual user role

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {primaryNavItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <NavItemLink key={item.href} item={item} isActive={isActive} />
              );
            })}
          </div>

          {/* More Dropdown + New Analysis Button */}
          <div className="flex items-center gap-2 ml-auto pl-4">
            <MoreDropdown pathname={pathname} userIsAdmin={userIsAdmin} />
            
            {/* New Analysis Button */}
            <Link
              href="/analyze"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>New analysis</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

