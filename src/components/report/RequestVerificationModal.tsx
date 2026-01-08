// @ts-nocheck
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Info, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Incoterms, ShippingMode, DeadlineDays } from "@/lib/projects/types";
import { VERIFICATION_SLA_LABEL } from "@/lib/constants/sla";
import { DEPOSIT_LINE, SLA_DESCRIPTION, SLA_UPDATE, BASELINE_DISCLAIMER } from "@/lib/copy";

interface RequestVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    targetMoq: number;
    incoterms: Incoterms;
    shippingMode: ShippingMode;
    deadlineDays: DeadlineDays;
    contactEmail: string;
    whatsapp?: string;
    notes?: string;
  }) => Promise<void>;
  productName?: string;
}

export function RequestVerificationModal({
  isOpen,
  onClose,
  onSubmit,
  productName,
}: RequestVerificationModalProps) {
  const [targetMoq, setTargetMoq] = useState("");
  const [incoterms, setIncoterms] = useState<Incoterms | "">("");
  const [shippingMode, setShippingMode] = useState<ShippingMode | "">("");
  const [deadlineDays, setDeadlineDays] = useState<DeadlineDays | "">("");
  const [contactEmail, setContactEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledgedDeposit, setAcknowledgedDeposit] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Reset form when modal closes
  const handleClose = () => {
    setStep(1);
    setAcknowledgedDeposit(false);
    setError("");
    setTargetMoq("");
    setIncoterms("");
    setShippingMode("");
    setDeadlineDays("");
    setContactEmail("");
    setWhatsapp("");
    setNotes("");
    onClose();
  };

  const validateStep1 = () => {
    if (!targetMoq || !incoterms || !shippingMode || !deadlineDays || !contactEmail) {
      setError("Please fill in all required fields");
      return false;
    }

    const moqNum = parseInt(targetMoq, 10);
    if (isNaN(moqNum) || moqNum <= 0) {
      setError("MOQ must be a positive number");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Back = () => {
    setStep(1);
    setError("");
  };

  const handlePayment = async () => {
    if (!acknowledgedDeposit) {
      setError("Please acknowledge that the deposit will be credited toward your first order");
      return;
    }

    setIsProcessingPayment(true);
    setError("");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Proceed with project creation
      const moqNum = parseInt(targetMoq, 10);
      await onSubmit({
        targetMoq: moqNum,
        incoterms: incoterms as Incoterms,
        shippingMode: shippingMode as ShippingMode,
        deadlineDays: deadlineDays as DeadlineDays,
        contactEmail,
        whatsapp: whatsapp || undefined,
        notes: notes || undefined,
      });

      // Form will be reset by handleClose
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        aria-labelledby="verification-modal-title"
        aria-describedby="verification-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="verification-modal-title" className="text-2xl">
            Request Verification
          </DialogTitle>
          <DialogDescription id="verification-modal-description">
            {step === 1
              ? productName
                ? `Verify quotes for ${productName}`
                : SLA_DESCRIPTION
              : "Confirm deposit and start verification"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 ? (
            <>
              {/* What you will receive */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  What you will receive
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>3 factories contacted within 2 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Quotes verified for precision and compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Confirmed numbers returned {VERIFICATION_SLA_LABEL}</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                  {BASELINE_DISCLAIMER}
                </p>
              </div>

              <form onSubmit={handleStep1Next} className="space-y-5">
            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetMoq" className="text-sm font-semibold">
                  Target MOQ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetMoq"
                  type="number"
                  min="1"
                  value={targetMoq}
                  onChange={(e) => setTargetMoq(e.target.value)}
                  placeholder="e.g., 1000"
                  required
                  className="mt-1"
                  aria-required="true"
                />
              </div>

              <div>
                <Label htmlFor="incoterms" className="text-sm font-semibold">
                  Incoterms <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={incoterms}
                  onValueChange={(value) => setIncoterms(value as Incoterms)}
                  required
                >
                  <SelectTrigger id="incoterms" className="mt-1" aria-required="true">
                    <SelectValue placeholder="Select incoterms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="EXW">EXW</SelectItem>
                    <SelectItem value="DDP">DDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shippingMode" className="text-sm font-semibold">
                  Shipping Mode <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={shippingMode}
                  onValueChange={(value) => setShippingMode(value as ShippingMode)}
                  required
                >
                  <SelectTrigger id="shippingMode" className="mt-1" aria-required="true">
                    <SelectValue placeholder="Select shipping mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AirExpress">Air Express</SelectItem>
                    <SelectItem value="AirFreight">Air Freight</SelectItem>
                    <SelectItem value="OceanFreight">Ocean Freight</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadlineDays" className="text-sm font-semibold">
                  Deadline <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={deadlineDays}
                  onValueChange={(value) => setDeadlineDays(parseInt(value, 10) as DeadlineDays)}
                  required
                >
                  <SelectTrigger id="deadlineDays" className="mt-1" aria-required="true">
                    <SelectValue placeholder="Select deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="contactEmail" className="text-sm font-semibold">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                  aria-required="true"
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Optional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp" className="text-sm font-semibold">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requirements or questions..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-electric-blue-600 hover:bg-electric-blue-700"
                  >
                    Continue
                  </Button>
                </div>
              </form>

              {/* Deposit Disclosure */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="flex-1">
                    {DEPOSIT_LINE}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                          aria-label="About deposit"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          The deposit covers factory outreach and verification work. If you proceed with an order, $49 is credited.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Deposit Confirmation */}
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Verification Deposit
                    </h3>
                    <div className="text-2xl font-bold text-slate-900">$49</div>
                  </div>

                  <ul className="space-y-2 text-sm text-slate-600 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>3 verified factories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Confirmed quotes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Compliance checklist</span>
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgedDeposit}
                        onChange={(e) => setAcknowledgedDeposit(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-electric-blue-600 focus:ring-electric-blue-500"
                        required
                      />
                      <span className="text-sm text-slate-700">
                        I understand {DEPOSIT_LINE.toLowerCase()}
                      </span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStep2Back}
                    disabled={isProcessingPayment}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !acknowledgedDeposit}
                    className="bg-electric-blue-600 hover:bg-electric-blue-700"
                  >
                    {isProcessingPayment ? "Processing..." : "Pay $49 and start verification"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

