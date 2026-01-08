// @ts-nocheck
// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format currency value with 2 decimals and commas.
 * Removes trailing .00 for a cleaner look if it's a whole number.
 */
export function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  
  return formatted;
}

/**
 * Format number with commas.
 * Removes trailing .00 for a cleaner look.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Standard date formatter for the platform.
 * Unifies display to user location (Toronto EST as requested) or local browser time.
 */
export function formatDate(date: string | Date): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // Force specific timezone if needed, but usually we want user's local
    // timeZone: "America/Toronto"
  });
}

/**
 * Standard time formatter for the platform.
 */
export function formatTime(date: string | Date): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Full date and time formatter.
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return "—";
  return `${formatDate(date)} ${formatTime(date)}`;
}














