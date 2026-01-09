"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Report Not Found
        </h1>
        <p className="text-slate-600 mb-6">
          The report may have failed to generate or was deleted.
        </p>
        <div className="space-y-3">
          <Link href="/analyze">
            <Button className="w-full bg-electric-blue-600 hover:bg-electric-blue-700">
              Start New Analysis
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

