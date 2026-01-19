import HomeDeck from "@/components/home/HomeDeck"
import { loadProofProducts } from "@/lib/proof/loadProofProducts"
import { loadProofStats } from "@/lib/proof/loadProofStats"

export default async function HomePage() {
  const [proofTeaserProducts, proofStats] = await Promise.all([
    loadProofProducts({ limit: 6 }),
    loadProofStats(),
  ])

  return (
    <main className="bg-white">
      <HomeDeck proofTeaserProducts={proofTeaserProducts} proofStats={proofStats} />
    </main>
  )
}
