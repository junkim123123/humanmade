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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {user.name || user.email}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setOpenUserId(openUserId === user.id ? null : user.id)
              }
            >
              <ChevronDown
                className={`transition-transform ${
                  openUserId === user.id ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{user.reports.length} Reports</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{user.role}</span>
              </div>
            </div>
          </CardContent>
          {openUserId === user.id && (
            <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
              {user.reports.length > 0 ? (
                user.reports.map((report) => (
                  <div
                    key={report.id}
                    className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {report.product_name}
                        </p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                          {report.status}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/messaging?user=${user.id}&ref=${report.id}`}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Nudge
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No reports yet.</p>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
