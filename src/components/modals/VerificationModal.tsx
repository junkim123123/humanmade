"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEPOSIT_LINE, SLA_DESCRIPTION, SLA_UPDATE } from "@/lib/copy";
import { createProject, updateProject } from "@/lib/storage/projects";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  productName?: string;
}

export function VerificationModal({
  isOpen,
  onClose,
  reportId = "toy-example",
  productName = "Product",
}: VerificationModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reportId) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/from-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (response.status === 401) {
        const next = encodeURIComponent(window.location.pathname);
        router.push(`/signin?next=${next}`);
        return;
      }

      const payload = await response.json();

      if (!response.ok || !payload?.orderId) {
        throw new Error(payload?.error || "Failed to start verification");
      }

      // Route to /app/orders/[orderId]
      router.push(`/app/orders/${payload.orderId}`);
    } catch (error) {
      console.error("Failed to create verification request:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start Verification</DialogTitle>
          <DialogDescription>
            Confirm your verification request to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-slate-600">
            <p className="mb-2">{SLA_DESCRIPTION}</p>
            <p className="mb-2">{SLA_UPDATE}</p>
            <p className="font-medium text-slate-900 mt-4">{DEPOSIT_LINE}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Not now
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-electric-blue-600 hover:bg-electric-blue-700"
          >
            {isSubmitting ? "Processing..." : "Confirm verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

