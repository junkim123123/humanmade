import { Metadata } from "next";
import { FileText, Image, ListChecks } from "lucide-react";
import { HeroProofSection } from "@/components/proof/HeroProofSection";
import { ProofVideoSection } from "@/components/proof/ProofVideoSection";
import { ProofLibrarySection } from "@/components/proof/ProofLibrarySection";
import {
  proofLibraryTags,
  proofProducts,
  proofVideos,
} from "@/components/proof/proofData";

export const metadata: Metadata = {
  title: "Proof | NexSupply",
  description: "Watch how we verify suppliers and costs in the field. Factory audits, customs data matching, and supplier outreach—all documented.",
};

export default function ProofPage() {
  // TODO: Replace proofData with API fetch when backend is ready.
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-slate-100/80">
      <HeroProofSection
        headline="Proof that your sourcing plan is engineered, not guessed."
        subheadline="Proof is the evidence pack that ties photos, checklists, and supplier documentation to every verified quote."
        primaryCta={{
          label: "Start verification",
          href: "/verify",
          helper: "Best when you need verified factories and documented quotes.",
        }}
        secondaryCta={{
          label: "Run an estimate",
          href: "/analyze",
          helper: "Use this to get a quick cost snapshot before outreach.",
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
        noteText="All proof packs are shared with IP authorization and sensitive details redacted."
        products={proofProducts}
        tagOptions={[...proofLibraryTags]}
        searchPlaceholder="Search by product name"
        emptyMessage="No proof packs match those filters."
        resultsLabel="{count} proof packs"
        photosLabel="Photos"
        tagLabel="Tags"
        outcomeLabel="Outcome"
        checklistLabel="Checklist preview"
        tagsLabel="Key tags"
        closeLabel="Close proof preview"
        loadMoreLabel="Load more proofs"
      />
    </div>
  );
}
