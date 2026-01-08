"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavSections, type AdminNavBadgeKey } from "./nav-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface AdminNavProps {
  badgeCounts?: Partial<Record<AdminNavBadgeKey, number>>;
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ badgeCounts }: AdminNavProps) {
  const pathname = usePathname();

  const activeSection = adminNavSections.find((section) => {
    if (isActivePath(pathname, section.href)) return true;
    if (!section.items) return false;
    return section.items.some((item) => isActivePath(pathname, item.href));
  });

  const getBadge = (key?: AdminNavBadgeKey) => {
    if (!key) return null;
    const value = badgeCounts?.[key] ?? 0;
    if (!value) return null;
    return (
      <span className="ml-auto h-5 min-w-[1.25rem] rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white flex items-center justify-center">
        {value}
      </span>
    );
  };

  return (
    <nav className="bg-white text-slate-900 border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-slate-900">
              <span className="text-blue-600">Nex</span>Supply
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {adminNavSections.map((section) => {
              const sectionActive = section === activeSection;
              return (
                <Link
                  key={section.label}
                  href={section.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    sectionActive
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{section.label}</span>
                  {getBadge(section.badgeKey)}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-semibold"
              asChild
            >
              <Link href="/app">← Back to App</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    A
                  </div>
                  <span className="font-semibold">Admin</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-700">
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
