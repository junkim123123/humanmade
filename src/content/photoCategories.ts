/**
 * Photo Categories Mapping
 * Maps folder names to English labels for the photo taxonomy system.
 */

export interface PhotoCategory {
  key: string;
  label: string;
  description?: string;
}

/**
 * Mapping of folder names to English labels.
 * Add new categories here as folders are created in public/product-photos/
 */
export const photoCategoryMap: Record<string, string> = {
  // English labels
  "Electronics": "Electronics",
  "Apparel": "Apparel",
  "Bags": "Bags",
  "Footwear": "Footwear",
  "Accessories": "Accessories",
  "Kitchenware": "Kitchenware",
  "Furniture": "Furniture",
  "Cosmetics": "Cosmetics",
  "Toys": "Toys",
  "Sports": "Sports",
  "Auto Parts": "Auto Parts",
  "Tools": "Tools",
  
  // English folder names (pass-through)
  "electronics": "Electronics",
  "apparel": "Apparel",
  "bags": "Bags",
  "footwear": "Footwear",
  "accessories": "Accessories",
  "kitchenware": "Kitchenware",
  "furniture": "Furniture",
  "cosmetics": "Cosmetics",
  "toys": "Toys",
  "sports": "Sports",
  "auto-parts": "Auto Parts",
  "tools": "Tools",
  "uncategorized": "Uncategorized",
};

/**
 * Get the English label for a folder name.
 * Falls back to the folder name itself if no mapping exists.
 */
export function getCategoryLabel(folderName: string): string {
  return photoCategoryMap[folderName] || folderName;
}

/**
 * Get all category keys (folder names) that have mappings.
 */
export function getAllCategoryKeys(): string[] {
  return Object.keys(photoCategoryMap);
}
