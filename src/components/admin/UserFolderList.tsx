"use client";

import { useState } from "react";
import {
  Folder,
  ChevronDown,
  MessageSquare,
  FileText,
  Briefcase,
  Star,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { extractProductName } from "@/lib/report/extractProductName";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Report {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  potential_savings?: string;
}

interface UserWithReports {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  reports: Report[];
}

export default function UserFolderList({
  users,
}: {
  users: UserWithReports[];
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <Card
          key={user.id}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {user.name || user.email.split('@')[0]}
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">{user.email}</CardDescription>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-slate-100"
              onClick={() =>
                setOpenUserId(openUserId === user.id ? null : user.id)
              }
            >
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  openUserId === user.id ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                <Briefcase className="w-4 h-4" />
                <span>{user.reports.length} Reports</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </CardContent>
          {openUserId === user.id && (
            <CardFooter className="flex-col items-start gap-3 pt-4 border-t border-slate-100 bg-slate-50/50">
              <div className="w-full space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Recent Reports</p>
                {user.reports.length > 0 ? (
                  user.reports.map((report) => (
                    <div
                      key={report.id}
                      className="w-full flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {extractProductName(report.product_name)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">
                              {report.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs" asChild>
                        <Link
                          href={`/admin/messaging?user=${user.id}&ref=${report.id}`}
                        >
                          Nudge
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 px-1 italic">No reports yet.</p>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
