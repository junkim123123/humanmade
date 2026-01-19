import fs from "node:fs/promises";
import path from "node:path";

import type { ProofProduct } from "@/components/proof/proofData";

type ManifestEntry = {
  id: string;
  folderName: string;
  displayName: string;
  slug: string;
  images: string[];
};

function guessCategory(name: string): string | undefined {
  const n = name.toLowerCase();
  if (
    /jelly|candy|marshmallow|gummy|snack|choco|chocolate|biscuit|pudding|gum|rice/i.test(n)
  ) {
    return "Confectionery";
  }
  if (
    /toy|keyring|keychain|fan|mirror|stamp|magnet|game|gun|stand|robot|dino|plush|bag|clip|acrylic|tumbler|suitcase/i.test(
      n
    )
  ) {
    return "Toys";
  }
  return undefined;
}

const TAG_POOL = ["Verified supplier", "Cost reduced", "Lead time known", "MOQ shown"] as const;

function pickTags(index: number): string[] {
  // Deterministic selection (no runtime randomness).
  const a = TAG_POOL[index % TAG_POOL.length];
  const b = TAG_POOL[(index + 1) % TAG_POOL.length];
  return index % 3 === 0 ? [a, b] : [a];
}

export async function loadProofProducts(options?: { limit?: number }): Promise<ProofProduct[]> {
  const limit = options?.limit ?? 120;
  const manifestPath = path.join(process.cwd(), "public", "product-photos", "photo-manifest.json");

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as ManifestEntry[];

    return manifest.slice(0, Math.max(0, limit)).map((entry, index) => {
      const imageUrls = (entry.images || []).filter(Boolean);
      const imageUrl = imageUrls[0] || "/file.svg";

      return {
        id: `proof-pack-${entry.slug || entry.id || index}`,
        name: entry.displayName || entry.folderName || entry.slug || `Proof pack ${index + 1}`,
        imageUrl,
        imageUrls,
        photosCount: imageUrls.length || 1,
        tags: pickTags(index),
        highlights: [
          "Supplier verified and key details recorded.",
          "Photos + checklist evidence captured during production.",
          "Sensitive details redacted; full pack shared with authorization.",
        ],
        category: guessCategory(entry.displayName || entry.folderName || ""),
      };
    });
  } catch {
    return [];
  }
}

