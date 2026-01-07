/**
 * Extract product name from product_name field
 * Handles both JSON format and plain string
 * 
 * @param productName - Product name string (may be JSON or plain string)
 * @returns Extracted product name as readable string
 */
export function extractProductName(productName: string | null | undefined): string {
  if (!productName) return "Unknown Product";
  
  // Try to parse as JSON (in case it's stored as JSON string)
  try {
    const parsed = JSON.parse(productName);
    if (typeof parsed === "object" && parsed !== null) {
      // Prefer fullName, then brand, then fallback to first available string
      if (parsed.fullName && typeof parsed.fullName === "string") {
        return parsed.fullName;
      }
      if (parsed.brand && typeof parsed.brand === "string") {
        return parsed.brand;
      }
      if (parsed.productName && typeof parsed.productName === "string") {
        return parsed.productName;
      }
      // If it's an object but none of the expected fields exist, try to find any string value
      for (const key in parsed) {
        if (typeof parsed[key] === "string" && parsed[key].trim().length > 0) {
          return parsed[key];
        }
      }
    }
  } catch {
    // Not JSON, use as-is
  }
  
  // Return as plain string if not JSON or parsing failed
  return productName;
}

