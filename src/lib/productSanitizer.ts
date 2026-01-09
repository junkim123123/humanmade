/**
 * Sanitize product names to remove trademarked IP for legal compliance.
 * Replaces specific character/brand names with generic terms.
 */

export interface SanitizedProduct {
  originalName: string;
  sanitizedName: string;
  requiresLicense: boolean;
  category: "generic" | "character" | "brand";
}

// IP patterns to remove/replace
const IP_PATTERNS = [
  // Anime/Game Characters
  { pattern: /pokemon|pikachu|charizard|blastoise|venusaur/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /one piece|luffy|zoro|nami/gi, replacement: "Anime Collection Figure", category: "character" as const },
  { pattern: /demon slayer|kimetsu no yaiba/gi, replacement: "Anime Collection Figure", category: "character" as const },
  { pattern: /chiikawa/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /shin-chan|crayon shin-chan/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /doraemon/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /minions/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /mickey mouse|mickey|minnie|donald|goofy/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /justice league|superman|batman|wonder woman/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /marvel|spider-man|iron man|captain america/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /pororo/gi, replacement: "K-Character Toy", category: "character" as const },
  { pattern: /secret jouju/gi, replacement: "K-Character Toy", category: "character" as const },
  { pattern: /line friends|bt21|cony|brown/gi, replacement: "K-Character Toy", category: "character" as const },
  { pattern: /pikmin/gi, replacement: "Licensed Character Toy (Auth Required)", category: "character" as const },
  { pattern: /keroro/gi, replacement: "Anime Collection Figure", category: "character" as const },
  // Brands
  { pattern: /haribo/gi, replacement: "Gummy Candy Packaging", category: "brand" as const },
];

// Priority safe items (generic, no IP issues)
const PRIORITY_ITEMS = [
  "3D Jelly",
  "Animal Bubble Stick",
  "BBQ Marshmallow",
  "Water Dispenser Toy",
  "Cube Pop",
  "Giant Bubble Stick",
  "Giant Cube Pop",
  "Tamna Water Dispenser",
];

/**
 * Sanitize a product name by removing/replacing IP-specific terms.
 */
export function sanitizeProductName(name: string): SanitizedProduct {
  let sanitized = name;
  let requiresLicense = false;
  let category: "generic" | "character" | "brand" = "generic";

  for (const { pattern, replacement, category: patternCategory } of IP_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = replacement;
      requiresLicense = true;
      category = patternCategory;
      break; // Use first match
    }
  }

  return {
    originalName: name,
    sanitizedName: sanitized,
    requiresLicense,
    category,
  };
}

/**
 * Sort products: priority items first, then generic, then character/brand items.
 */
export function sortProductsBySafety<T extends { displayName: string }>(
  products: T[]
): T[] {
  return [...products].sort((a, b) => {
    const aName = a.displayName.toLowerCase();
    const bName = b.displayName.toLowerCase();

    // Check if in priority list
    const aPriority = PRIORITY_ITEMS.some((p) => aName.includes(p.toLowerCase()));
    const bPriority = PRIORITY_ITEMS.some((p) => bName.includes(p.toLowerCase()));

    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    // Check if requires license
    const aSanitized = sanitizeProductName(a.displayName);
    const bSanitized = sanitizeProductName(b.displayName);

    if (!aSanitized.requiresLicense && bSanitized.requiresLicense) return -1;
    if (aSanitized.requiresLicense && !bSanitized.requiresLicense) return 1;

    // Alphabetical for same category
    return a.displayName.localeCompare(b.displayName);
  });
}

