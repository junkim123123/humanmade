export type AdminNavBadgeKey = "queue" | "inbox" | "verifications";

export interface AdminNavItem {
  label: string;
  href: string;
  badgeKey?: AdminNavBadgeKey;
}

export interface AdminNavSection {
  label: string;
  href: string;
  items?: AdminNavItem[];
  badgeKey?: AdminNavBadgeKey;
}

export const adminNavSections: AdminNavSection[] = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Money Queue (Paid)",
    href: "/admin/queue",
  },
  {
    label: "Lead Pool (Free)",
    href: "/admin/leads",
  },
  {
    label: "Messaging",
    href: "/admin/inbox",
  },
  {
    label: "User Mgmt",
    href: "/admin/users",
  },
  {
    label: "Upload",
    href: "/admin/upload",
  },
];
