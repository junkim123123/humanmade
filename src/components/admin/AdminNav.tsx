import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavSections, type AdminNavBadgeKey } from "./nav-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-white">
              <span className="text-blue-400">Nex</span>Supply
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {adminNavSections.map((section) => {
              const sectionActive = section === activeSection;
              return (
                <Link
                  key={section.label}
                  href={section.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    sectionActive
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-800"
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
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              asChild
            >
              <Link href="/app">← Back to App</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                    A
                  </div>
                  <span>Admin</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                <DropdownMenuItem className="hover:bg-slate-700">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-700">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-700">
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
