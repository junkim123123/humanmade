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
  photosCount: number;
  tags: string[];
  highlights: string[];
  category?: string;
};

export const proofVideos: ProofVideo[] = [
  {
    id: "proof-video-ops-01",
    title: "Warehouse intake and label verification",
    category: "Operations",
    duration: "2:14",
    description: "See how inbound goods are checked against packing lists and labels.",
    thumbnailUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
    href: "https://www.youtube.com/watch?v=9Wzrd6ZyM4Q",
  },
  {
    id: "proof-video-qc-01",
    title: "AQL inspection walkthrough",
    category: "QC",
    duration: "3:02",
    description: "Sampling method, defects chart, and pass/fail criteria in the field.",
    thumbnailUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
    href: "https://www.youtube.com/watch?v=J7oH3G2ZzqI",
  },
  {
    id: "proof-video-sourcing-01",
    title: "Factory outreach sequence",
    category: "Sourcing",
    duration: "2:35",
    description: "Outbound sourcing and the first 48 hours of verification.",
    thumbnailUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
    href: "https://www.youtube.com/watch?v=9s4kVgDgC6Q",
  },
  {
    id: "proof-video-qc-02",
    title: "On-site compliance checklist",
    category: "QC",
    duration: "1:58",
    description: "Critical safety and compliance checks before shipment release.",
    thumbnailUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
    href: "https://www.youtube.com/watch?v=wHLsNR1f6bA",
  },
  {
    id: "proof-video-ops-02",
    title: "Port handoff and document control",
    category: "Operations",
    duration: "2:46",
    description: "How we manage paperwork from factory exit to vessel booking.",
    thumbnailUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
    href: "https://www.youtube.com/watch?v=hpI9fS8lS5w",
  },
  {
    id: "proof-video-sourcing-02",
    title: "Quote triangulation with evidence",
    category: "Sourcing",
    duration: "2:21",
    description: "Comparing pricing, lead time, and MOQ across verified suppliers.",
    thumbnailUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
    href: "https://www.youtube.com/watch?v=9gXw1mU9i0s",
  },
];

export const proofProducts: ProofProduct[] = [
  {
    id: "proof-product-001",
    name: "Fruit Lover Marshmallow",
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
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
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
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
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
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
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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
    imageUrl: "/product-photos/3D Jelly/mmexport1758762843530.jpg",
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
    imageUrl: "/product-photos/Fruit Marshmallow/mmexport1758763658404.jpg",
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
    imageUrl: "/product-photos/Demon Slayer Keyring/mmexport1758763260109.jpg",
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

export const proofLibraryTags = [
  "Verified supplier",
  "Cost reduced",
  "Lead time known",
  "MOQ shown",
] as const;
