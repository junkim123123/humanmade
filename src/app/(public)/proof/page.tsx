import { Metadata } from "next";
import { FileText, Image, ListChecks } from "lucide-react";
import { HeroProofSection } from "@/components/proof/HeroProofSection";
import { ProofVideoSection } from "@/components/proof/ProofVideoSection";
import { ProofLibrarySection } from "@/components/proof/ProofLibrarySection";
import { proofVideos } from "@/components/proof/proofData";
import { loadProofProducts } from "@/lib/proof/loadProofProducts";

export const metadata: Metadata = {
  title: "Proof | NexSupply",
  description: "Watch how we verify suppliers and costs in the field. Factory audits, customs data matching, and supplier outreach—all documented.",
};

export default async function ProofPage() {
  const proofProducts = await loadProofProducts({ limit: 120 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-slate-100/80">
      <HeroProofSection
        headline="Proof, not guesses."
        subheadline="Evidence packs tied to every verified quote."
        primaryCta={{
          label: "Start verification",
          href: "/verify",
          helper: "",
        }}
        secondaryCta={{
          label: "Run an estimate",
          href: "/analyze",
          helper: "",
        }}
        proofPackItems={[
          {
            icon: <Image className="h-4 w-4" />,
            title: "Photos",
            description: "Factory floor, QC checks, and packaging evidence.",
          },
          {
            icon: <ListChecks className="h-4 w-4" />,
            title: "Checklists",
            description: "QC, compliance, and production verification steps.",
          },
          {
            icon: <FileText className="h-4 w-4" />,
            title: "Supplier docs",
            description: "Signed documents tied to every verified quote.",
          },
        ]}
      />

      <ProofVideoSection
        title="Watch proof"
        subtitle="See verification in action across operations, QC, and sourcing."
        categories={[
          { label: "All", value: "All" },
          { label: "Operations", value: "Operations" },
          { label: "QC", value: "QC" },
          { label: "Sourcing", value: "Sourcing" },
        ]}
        videos={proofVideos}
        emptyMessage="No proof videos match this category yet."
        openLabel="Open"
      />

      <ProofLibrarySection
        title="Proof library"
        subtitle="Search real product proofs with lightweight evidence previews."
        noteText="Sample previews only. Full proof packs are shared with IP authorization and sensitive details redacted."
        products={proofProducts}
        searchPlaceholder="Search by product name"
        emptyMessage="No proof packs match those filters."
        resultsLabel="{count} proof packs"
        photosLabel="Photos"
        outcomeLabel="Outcome"
        checklistLabel="Checklist preview"
        tagsLabel="Key tags"
        closeLabel="Close proof preview"
        loadMoreLabel="Load more proofs"
      />
    </div>
  );
}
