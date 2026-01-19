export type ProofVideoCategory = "Operations" | "QC" | "Sourcing";

export type ProofVideo = {
  id: string;
  title: string;
  category: ProofVideoCategory;
  duration: string;
  description: string;
  thumbnailUrl: string;
  href: string;
};

export type ProofProduct = {
  id: string;
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  photosCount: number;
  tags: string[];
  highlights: string[];
  category?: string;
};

export const proofVideos: ProofVideo[] = [
  {
    id: "proof-video-ops-01",
    title: "Factory outreach sequence",
    category: "Sourcing",
    duration: "2:35",
    description: "Outbound sourcing and the first 48 hours of verification.",
    thumbnailUrl: "https://img.youtube.com/vi/iJRGh4Tyhbw/hqdefault.jpg",
    href: "https://youtu.be/iJRGh4Tyhbw",
  },
  {
    id: "proof-video-qc-01",
    title: "Quote triangulation with evidence",
    category: "Sourcing",
    duration: "2:21",
    description: "Comparing pricing, lead time, and MOQ across verified suppliers.",
    thumbnailUrl: "https://img.youtube.com/vi/aJOCT_E0RlE/hqdefault.jpg",
    href: "https://youtu.be/aJOCT_E0RlE",
  },
  {
    id: "proof-video-ops-02",
    title: "On-site compliance checklist",
    category: "QC",
    duration: "1:58",
    description: "Critical safety and compliance checks before shipment release.",
    thumbnailUrl: "https://img.youtube.com/vi/1pMa-6muGQ0/hqdefault.jpg",
    href: "https://youtu.be/1pMa-6muGQ0",
  },
];

export const proofProducts: ProofProduct[] = [
  {
    id: "proof-product-001",
    name: "Fruit Lover Marshmallow",
    imageUrl: "/product-photos/Fruit%20Lover%20Marshmallow/mmexport1758763661424.jpg",
    photosCount: 6,
    tags: ["Verified supplier", "MOQ shown", "Lead time known"],
    highlights: [
      "Verified manufacturer with export record evidence.",
      "MOQ locked with packaging options.",
      "Lead time validated across two production runs.",
      "Ingredient sheet provided with compliance notes.",
      "Price range tied to volume breaks.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-002",
    name: "Demon Slayer Keychain",
    imageUrl: "/product-photos/Demon%20Slayer%20Keyring/mmexport1758763352938.jpg",
    photosCount: 8,
    tags: ["Cost reduced", "Verified supplier"],
    highlights: [
      "Factory audit photos included.",
      "Cost reduced through material optimization.",
      "MOQ aligned with seasonal demand.",
      "Packaging spec confirmed.",
      "IP authorization documented by supplier.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-003",
    name: "3D Jelly Snacks",
    imageUrl: "/product-photos/3D%20Jelly/mmexport1758762845466.jpg",
    photosCount: 5,
    tags: ["Lead time known", "MOQ shown"],
    highlights: [
      "Production schedule aligned to launch date.",
      "MOQ validated across two factories.",
      "Ingredient labeling verified.",
      "Shipping plan includes cold-chain options.",
      "Custom mold timing documented.",
    ],
    category: "Snacks",
  },
  {
    id: "proof-product-004",
    name: "Mini Plush Set",
    imageUrl: "/product-photos/Plush%20Keyring/mmexport1758763868338.jpg",
    photosCount: 7,
    tags: ["Verified supplier", "Cost reduced"],
    highlights: [
      "Factory shortlist with capacity confirmation.",
      "Cost reduced via fabric optimization.",
      "Stitching QA checklist attached.",
      "Packaging drop-test results shared.",
      "Sample lead time confirmed.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-005",
    name: "Assorted Jelly Cups",
    imageUrl: "/product-photos/Assorted%20Jelly/mmexport1758763748818.jpg",
    photosCount: 4,
    tags: ["MOQ shown", "Cost reduced"],
    highlights: [
      "MOQ and price breaks aligned with demand.",
      "Supplier HACCP checklist included.",
      "Tariff codes verified for import.",
      "Packing list templates provided.",
      "Lead time validated for peak season.",
    ],
    category: "Snacks",
  },
  {
    id: "proof-product-006",
    name: "Premium Gummy Mix",
    imageUrl: "/product-photos/Yummy%20Jelly%20Beans/mmexport1758762692927.jpg",
    photosCount: 6,
    tags: ["Verified supplier", "Lead time known"],
    highlights: [
      "Supplier verification report attached.",
      "Lead time confirmed with buffer plan.",
      "Ingredient compliance checks complete.",
      "Packaging artwork proofed.",
      "Shipping estimate documented.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-007",
    name: "Collectible Acrylic Set",
    imageUrl: "/product-photos/Chiikawa%20Acrylic/mmexport1758763210091.jpg",
    photosCount: 5,
    tags: ["Verified supplier", "MOQ shown"],
    highlights: [
      "Factory QC checklist delivered.",
      "MOQ confirmed with price tiers.",
      "Material compliance documented.",
      "Artwork proofing timeline attached.",
      "Export documentation ready.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-008",
    name: "Seasonal Candy Pack",
    imageUrl: "/product-photos/Seasonal%20Marshmallow/mmexport1758762893174.jpg",
    photosCount: 7,
    tags: ["Cost reduced", "Lead time known"],
    highlights: [
      "Cost reduced by packaging optimization.",
      "Lead time confirmed with factory slot.",
      "Ingredient sheet verified.",
      "Custom packaging samples documented.",
      "Shipping plan aligned with launch.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-009",
    name: "Character Keyring Bundle",
    imageUrl: "/product-photos/Justice%20League%20Sweet%20Candy%20Keyring/mmexport1758763234478.jpg",
    photosCount: 6,
    tags: ["Verified supplier", "MOQ shown"],
    highlights: [
      "Supplier docs with compliance checks.",
      "MOQ confirmed for bundled variants.",
      "QC sampling plan shared.",
      "Lead time validated.",
      "Packaging checklist included.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-010",
    name: "Fruit Jelly Bento",
    imageUrl: "/product-photos/Tasty%20Fruit%20Jelly/mmexport1758763753159.jpg",
    photosCount: 4,
    tags: ["Lead time known", "Cost reduced"],
    highlights: [
      "Lead time aligned to retail calendar.",
      "Cost reduced through SKU consolidation.",
      "Compliance checklist attached.",
      "Carton specs verified.",
      "Freight plan documented.",
    ],
    category: "Snacks",
  },
  {
    id: "proof-product-011",
    name: "Marshmallow Gift Box",
    imageUrl: "/product-photos/BBQ%20Marshmallow/mmexport1758763625115.jpg",
    photosCount: 5,
    tags: ["Verified supplier", "MOQ shown"],
    highlights: [
      "Factory verification report attached.",
      "MOQ confirmed for gift box runs.",
      "Packaging specs approved.",
      "Lead time confirmed for Q4.",
      "Ingredient audit complete.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-012",
    name: "Anime Bag Clip Set",
    imageUrl: "/product-photos/Keroro%20Keyring/mmexport1758763261595.jpg",
    photosCount: 6,
    tags: ["Cost reduced", "Verified supplier"],
    highlights: [
      "Cost reduced via mold reuse.",
      "Supplier compliance docs attached.",
      "MOQ confirmed for variants.",
      "QC checklist included.",
      "Packaging layout validated.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-013",
    name: "Layered Jelly Trio",
    imageUrl: "/product-photos/Tanghulu%20Jelly/mmexport1758763731313.jpg",
    photosCount: 5,
    tags: ["MOQ shown", "Lead time known"],
    highlights: [
      "MOQ aligned with seasonal plan.",
      "Lead time validated for first shipment.",
      "Compliance checklist provided.",
      "Ingredient review complete.",
      "Shipping timeline documented.",
    ],
    category: "Snacks",
  },
  {
    id: "proof-product-014",
    name: "Holiday Marshmallow Mix",
    imageUrl: "/product-photos/Seasonal%20Marshmallow/mmexport1758763677584.jpg",
    photosCount: 7,
    tags: ["Verified supplier", "Cost reduced"],
    highlights: [
      "Verified supplier with export history.",
      "Cost reduced through ingredient swap.",
      "Lead time confirmed.",
      "Packaging checklist approved.",
      "Freight plan documented.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-015",
    name: "Collector Keychain Pack",
    imageUrl: "/product-photos/Bread%20Barbershop%20Keyring/mmexport1758763348068.jpg",
    photosCount: 8,
    tags: ["Verified supplier", "MOQ shown"],
    highlights: [
      "Supplier docs with QA checklist.",
      "MOQ confirmed for bulk run.",
      "Lead time validated.",
      "Material compliance verified.",
      "Packaging proof supplied.",
    ],
    category: "Toys",
  },
  {
    id: "proof-product-016",
    name: "Crystal Jelly Cups",
    imageUrl: "/product-photos/Crystal%20Candy/mmexport1758762708496.jpg",
    photosCount: 6,
    tags: ["Lead time known", "Cost reduced"],
    highlights: [
      "Lead time verified for holiday slot.",
      "Cost reduced with optimized carton.",
      "Compliance checklist delivered.",
      "Ingredient documentation attached.",
      "Shipping plan validated.",
    ],
    category: "Snacks",
  },
  {
    id: "proof-product-017",
    name: "Soft Candy Assortment",
    imageUrl: "/product-photos/Soft%20Sweet%20Jelly%20Marshmallow/mmexport1758763612281.jpg",
    photosCount: 5,
    tags: ["Verified supplier", "MOQ shown"],
    highlights: [
      "Supplier verification docs included.",
      "MOQ confirmed for assortments.",
      "Lead time aligned with campaign.",
      "Ingredient checks complete.",
      "Packaging tests recorded.",
    ],
    category: "Confectionery",
  },
  {
    id: "proof-product-018",
    name: "Limited Edition Keyring",
    imageUrl: "/product-photos/LINE%20FRIENDS%20Stand/mmexport1758763204852.jpg",
    photosCount: 7,
    tags: ["Cost reduced", "Verified supplier"],
    highlights: [
      "Cost reduced through consolidation.",
      "Verified supplier with audit photos.",
      "MOQ confirmed for limited run.",
      "QC checklist attached.",
      "Packaging documentation ready.",
    ],
    category: "Toys",
  },
];

