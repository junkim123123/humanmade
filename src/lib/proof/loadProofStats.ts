import fs from "node:fs/promises";
import path from "node:path";

type ManifestEntry = {
  images?: string[];
};

export type ProofStats = {
  packsCount: number;
  photosCount: number;
};

export async function loadProofStats(): Promise<ProofStats> {
  const manifestPath = path.join(process.cwd(), "public", "product-photos", "photo-manifest.json");

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as ManifestEntry[];
    const packsCount = Array.isArray(manifest) ? manifest.length : 0;
    const photosCount = Array.isArray(manifest)
      ? manifest.reduce((sum, entry) => sum + ((entry.images?.length || 0) as number), 0)
      : 0;
    return { packsCount, photosCount };
  } catch {
    return { packsCount: 0, photosCount: 0 };
  }
}

