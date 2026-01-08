"use client";

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { DEPOSIT_LINE, SLA_DESCRIPTION, SLA_UPDATE, EXECUTION_FEE_LINE } from "@/lib/copy";
import { VerificationModal } from "@/components/modals/VerificationModal";

export function PricingCards() {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Free */}
      <PricingCard
        title="Free"
        price="$0"
        description="Baseline ranges from LLM and category signals."
        included={[
          "Product classification and keywords",
          "FOB and landed cost range",
          "Risk checklist",
          "Supplier quote request checklist",
        ]}
        cta={{
          label: "Start analysis",
          href: "/analyze",
        }}
      />

      {/* Verification */}
      <PricingCard
        title="Verification"
        price="$49 deposit per product"
        description={SLA_DESCRIPTION}
        badge="Credited on order"
        slaLine={SLA_UPDATE}
        included={[
          "Exporter vs forwarder check",
          "MOQ and lead time confirmed",
          "Sample plan",
          "Compliance checklist",
          "3 supplier options with confirmed quotes",
        ]}
        cta={{
          label: "Start Verification",
          href: "/analyze",
          onClick: () => setShowVerificationModal(true),
        }}
      />

      {/* Execution */}
      <PricingCard
        title="Execution"
        price="5% of FOB"
        priceSubLine="Only if you place an order"
        description={EXECUTION_FEE_LINE}
        included={[
          "Factory negotiation and quoting",
          "Sample coordination",
          "Packaging and labeling alignment",
          "QC plan and inspection support",
          "Shipping handoff and documentation support",
        ]}
        cta={{
          label: "View orders",
          href: "/app/orders",
          variant: "outline",
        }}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </div>
  );
}

