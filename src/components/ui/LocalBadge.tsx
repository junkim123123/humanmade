"use client";

import { MapPin } from "lucide-react";

export function LocalBadge() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
      <MapPin className="w-4 h-4 text-slate-600" />
      <span className="text-sm font-medium text-slate-700">
        Proudly serving the St. Louis & Toronto SMB community
      </span>
    </div>
  );
}

