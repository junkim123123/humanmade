/**
 * Verdict Templates
 * 100 pre-written verdict statements in English, organized by decision type
 * Templates emphasize that weak data is actually our strength
 */

export interface VerdictTemplate {
  id: number;
  decision: "GO" | "HOLD" | "NO";
  statement: string;
  categoryHints?: string[]; // Product categories this template works well for
}

export const VERDICT_TEMPLATES: VerdictTemplate[] = [
  // GO verdicts (1-20)
  {
    id: 1,
    decision: "GO",
    statement: "Data is shallow now, but the profit structure is simple enough to confirm quickly. With just a barcode or label, we can fill factory candidates and pricing rationale within 48 hours.",
    categoryHints: ["food", "snacks", "beverages"],
  },
  {
    id: 2,
    decision: "GO",
    statement: "High likelihood of margin with risk only from missing inputs. Once photo quality improves, exact matches from the same product category import records will appear immediately.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 3,
    decision: "GO",
    statement: "Product structure is common, so supplier discovery is fast. Upload a clear label today and we can list 3 factories by tomorrow.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 4,
    decision: "GO",
    statement: "Evidence is thin now, but HS classification range is narrow for this category. Once ingredient list is visible, duty and regulations can be locked in cleanly.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 5,
    decision: "GO",
    statement: "Price shows as a range, but MOQ and logistics variables are small, making execution easy. Add 2 confirmation photos and we can tighten pricing for decision-making.",
    categoryHints: ["home", "stationery_office", "pet"],
  },
  {
    id: 6,
    decision: "GO",
    statement: "Many similar imports exist, making this a data-rich type. This is our strong area, so evidence building is fast.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 7,
    decision: "GO",
    statement: "Risk isn't product classification but missing packaging info. Once pack unit is captured, shipping cost per unit calculates stably.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 8,
    decision: "GO",
    statement: "Even with unclear brand, product structure is clear so matching works well. A clear barcode enables exact matching.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 9,
    decision: "GO",
    statement: "Low evidence now, but execution cost is low, making it favorable for testing. A plan emerges to verify at box-level immediately.",
    categoryHints: ["home", "pet", "stationery_office"],
  },
  {
    id: 10,
    decision: "GO",
    statement: "Many alternative suppliers exist in this category, creating negotiating power. We can fill the factory pool easily, reducing risk.",
    categoryHints: ["apparel", "home", "electronics"],
  },
  {
    id: 11,
    decision: "GO",
    statement: "Even if duty fluctuates slightly, the margin can absorb it. We can quickly find evidence and narrow the range.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 12,
    decision: "GO",
    statement: "Broad demand and low seasonality mean low inventory risk. Once reliable suppliers are secured, repeat order structure is possible immediately.",
    categoryHints: ["food", "home", "stationery_office"],
  },
  {
    id: 13,
    decision: "GO",
    statement: "Packaging specs are key, and that's solved with one photo. Strengthen uploads and factory candidates appear immediately.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 14,
    decision: "GO",
    statement: "Weak data is fine. This type has a standardized supply chain, so we can find it quickly.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 15,
    decision: "GO",
    statement: "At this stage, we don't need more information—just clear evidence. Once label and barcode are accurate, the rest auto-resolves.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 16,
    decision: "GO",
    statement: "Origin unconfirmed, but many alternative scenarios exist. Once confirmed, duty and logistics stabilize together.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 17,
    decision: "GO",
    statement: "Even with toy elements, main composition character is clear. We can lock HS classification quickly.",
    categoryHints: ["toy", "hybrid"],
  },
  {
    id: 18,
    decision: "GO",
    statement: "Supplier competition exists, creating significant price compression opportunity. Start verification and negotiation-ready structure emerges.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 19,
    decision: "GO",
    statement: "Weak signals now, but category-based matching works well for this product. Once photos are organized, candidate list grows quickly.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 20,
    decision: "GO",
    statement: "Low execution difficulty, high information gain. Run a short test, and once data strengthens, expand.",
    categoryHints: ["home", "pet", "stationery_office"],
  },
  
  // HOLD verdicts (21-40)
  {
    id: 21,
    decision: "HOLD",
    statement: "Price range is wide, so conclusion is shaky now. Secure a barcode and evidence attaches, enabling GO conversion.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 22,
    decision: "HOLD",
    statement: "Origin and ingredients unclear, leaving regulatory risk. Once label is readable, classification and labeling risk can be resolved immediately.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 23,
    decision: "HOLD",
    statement: "MOQ is variable, making cash burden uncertain. Secure 2 candidate factories and MOQ fixes to realistic levels immediately.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 24,
    decision: "HOLD",
    statement: "Shipping cost per unit is sensitive to weight for this type. Once actual weight is confirmed, price range narrows quickly.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 25,
    decision: "HOLD",
    statement: "Data shortage delays decision-making now. We can find it quickly, so start by improving photo quality.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 26,
    decision: "HOLD",
    statement: "Exact matches haven't appeared yet, but similar matches are sufficient. One more piece of evidence and GO likelihood rises.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 27,
    decision: "HOLD",
    statement: "Components are complex, so classification may split. A photo showing composition ratio enables immediate lock.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  {
    id: 28,
    decision: "HOLD",
    statement: "Selling price looks fine, but pack unit is unclear. Once case unit is captured, profit calculation becomes clean.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 29,
    decision: "HOLD",
    statement: "Factory candidates are findable, but evidence is insufficient now, lowering confidence. Start verification flow and evidence attaches, converting to recommended.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 30,
    decision: "HOLD",
    statement: "Demand appears to exist, but differentiation is unclear. Once product point is summarized in one line, suppliers can be narrowed more accurately.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 31,
    decision: "HOLD",
    statement: "Label is blurry, so ingredient and origin evidence is missing. Once clear label uploads, regulations and HS resolve simultaneously.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 32,
    decision: "HOLD",
    statement: "Price coverage is low, making estimates large. Expand factory pool by just 3 more and range narrows dramatically.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 33,
    decision: "HOLD",
    statement: "At this stage, it's not risk but insufficient information. We can find it, so just strengthen inputs.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 34,
    decision: "HOLD",
    statement: "Shipping mode choice can significantly change unit cost. Once box volume is confirmed, optimal mode recommendation becomes possible.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 35,
    decision: "HOLD",
    statement: "Regulatory triggers like accessories or batteries may exist. Add component photos and it resolves to NO or GO immediately.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  {
    id: 36,
    decision: "HOLD",
    statement: "No brand anchor, so data scatters. One front package photo captures anchor and matching improves significantly.",
    categoryHints: ["food", "beauty", "electronics"],
  },
  {
    id: 37,
    decision: "HOLD",
    statement: "Import records look sparse, but alternative sources are sufficient. Our approach of finding and filling suppliers fits better.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 38,
    decision: "HOLD",
    statement: "Currently at range estimation stage, so definitive conclusion is risky. Start verification and confirmed quotes arrive within 1 week.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 39,
    decision: "HOLD",
    statement: "Lead time is variable, making inventory planning unclear. Check candidate factories and production calendar, and it becomes confirmed immediately.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 40,
    decision: "HOLD",
    statement: "Quality risk may be key. Capture sample standards and QC points, and execution becomes safer.",
    categoryHints: ["electronics", "apparel", "beauty"],
  },
  
  // NO verdicts (41-50)
  {
    id: 41,
    decision: "NO",
    statement: "High likelihood of regulatory triggers with insufficient label evidence. At current state, customs and risk costs are likely to be excessive.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  {
    id: 42,
    decision: "NO",
    statement: "Unit cost is in a range that's hard to sustain in the selling price structure. If factory replacement is assumed, re-evaluation to GO is possible.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 43,
    decision: "NO",
    statement: "Too many alternative products and weak differentiation. Same effort yields better profit in easier categories.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 44,
    decision: "NO",
    statement: "Shipping cost sensitivity is too high for this type—small errors break profitability. If weight and volume can't be confirmed, stopping is correct.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 45,
    decision: "NO",
    statement: "No way to confirm origin and ingredients leaves risk. Don't execute until reliable label is secured—it's safer.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 46,
    decision: "NO",
    statement: "Market price is already fixed low, making margin difficult. Not recommended unless premium positioning.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 47,
    decision: "NO",
    statement: "Product classification split range is large and duty difference is critical. Verification cost may exceed current expected profit.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  {
    id: 48,
    decision: "NO",
    statement: "Suppliers are findable, but quality variance is high in this category. Without brand trust, return costs can grow.",
    categoryHints: ["electronics", "apparel", "beauty"],
  },
  {
    id: 49,
    decision: "NO",
    statement: "Lead time is long or unstable, risking inventory. For slow-rotation retail, loss likelihood is high.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 50,
    decision: "NO",
    statement: "Regulatory confirmation is required, but needed documents aren't secured. Re-review possible if switching to document-capable suppliers.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  
  // GO verdicts (51-60)
  {
    id: 51,
    decision: "GO",
    statement: "Blurry label is fine. We'll secure suppliers first from import records and similar products, then confirm label later.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 52,
    decision: "GO",
    statement: "Evidence is weak, but category-based HS candidates are stable. Confirm with documents in verification stage and risk drops significantly.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 53,
    decision: "GO",
    statement: "Factory candidates aren't visible yet, but that's fine. Once keywords and product name are organized, we can fill matching from behind.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 54,
    decision: "GO",
    statement: "Currently low evidence due to missing inputs. But this type has high recovery rate in our database.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 55,
    decision: "GO",
    statement: "Price looks wide, but structure has large negotiation room. Compare just 3 factories and unit cost drops immediately.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 56,
    decision: "GO",
    statement: "Product is simple and alternative factory pool is deep. Once photos are organized, actual factory list-up is fast.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 57,
    decision: "GO",
    statement: "Steady demand type enables repeat orders. Confirm once and operations become easier.",
    categoryHints: ["food", "home", "stationery_office"],
  },
  {
    id: 58,
    decision: "GO",
    statement: "Once pack specs are confirmed, shipping cost stabilizes. Add one box photo and report completes.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 59,
    decision: "GO",
    statement: "Origin is empty, but reverse lookup from import data is possible. We can find it immediately and attach as evidence.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 60,
    decision: "GO",
    statement: "Even with competition, supplier listing and price optimization can win. Start verification and executable plan emerges.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  
  // HOLD verdicts (61-70)
  {
    id: 61,
    decision: "HOLD",
    statement: "Product name is captured, but composition info is insufficient. One photo showing composition ratio enables decision.",
    categoryHints: ["food", "beauty", "hybrid"],
  },
  {
    id: 62,
    decision: "HOLD",
    statement: "Factory candidates can emerge, but probability is 50/50. Need front photo showing barcode or logo.",
    categoryHints: ["food", "beauty", "electronics"],
  },
  {
    id: 63,
    decision: "HOLD",
    statement: "Price looks fine, but regulatory labeling risk exists. Once label text is secured, risk can be resolved.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 64,
    decision: "HOLD",
    statement: "Weight estimate is default, so shipping cost confidence is low. Input actual measured weight and it narrows to GO immediately.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 65,
    decision: "HOLD",
    statement: "Shipment unit locked at 1 distorts calculation. Once units per case are captured, unit cost becomes realistic.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 66,
    decision: "HOLD",
    statement: "Factory intel exists, but product specs are insufficient. Organize one spec line and candidates become more accurate.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 67,
    decision: "HOLD",
    statement: "Duty candidates may split two ways. One ingredient list photo locks it to one path immediately.",
    categoryHints: ["food", "beauty", "hybrid"],
  },
  {
    id: 68,
    decision: "HOLD",
    statement: "Demand appears to exist, but sales channel fit is unclear. Decide if retail or online, and factory selection changes too.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 69,
    decision: "HOLD",
    statement: "This report has weak data. But it's a type where we can attach evidence, so just strengthen inputs.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 70,
    decision: "HOLD",
    statement: "No brand anchor lowers matching accuracy. Front and bottom package photos improve it significantly.",
    categoryHints: ["food", "beauty", "electronics"],
  },
  
  // NO verdicts (71-80)
  {
    id: 71,
    decision: "NO",
    statement: "Logistics and duty variables are too large relative to selling price. Expected volatility may consume margin.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 72,
    decision: "NO",
    statement: "Import records are sparse and alternative suppliers are also unclear. This case has low efficiency relative to verification cost.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 73,
    decision: "NO",
    statement: "Label is unreadable and re-shooting is difficult in this environment—proceeding is risky. Without evidence, risk remains.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 74,
    decision: "NO",
    statement: "Quality issues are frequent in this type, and without verification system, losses occur. Re-review possible if QC system exists.",
    categoryHints: ["electronics", "apparel", "beauty"],
  },
  {
    id: 75,
    decision: "NO",
    statement: "Market is already oversaturated and must compete on price alone. Not recommended without special differentiation.",
    categoryHints: ["food", "snacks", "stationery_office"],
  },
  {
    id: 76,
    decision: "NO",
    statement: "Regulatory documents are required, but supplier may not provide them. Must switch to document-capable suppliers.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  {
    id: 77,
    decision: "NO",
    statement: "Long lead time and strong seasonality create high inventory risk. Not suitable unless rotation is fast.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 78,
    decision: "NO",
    statement: "Packaging damage risk is high and structure improvement is difficult. Return and exchange costs can grow.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 79,
    decision: "NO",
    statement: "Shipping cost per unit is structurally high, making price position ambiguous. If consumer price can't be raised, no profit remains.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 80,
    decision: "NO",
    statement: "One core variable is uncertain and it dominates profitability. If it can't be confirmed, stopping is correct.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  
  // GO verdicts (81-90)
  {
    id: 81,
    decision: "GO",
    statement: "Current report state is sufficient as a starting point. The moment we attach evidence, it changes to an execution plan immediately.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 82,
    decision: "GO",
    statement: "No matches is fine. For this category, we're stronger at directly pulling factory pools.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 83,
    decision: "GO",
    statement: "HS candidates narrow easily to one for this product. Once label is readable, duty and regulations resolve together.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 84,
    decision: "GO",
    statement: "Supplier risk is low, only information risk exists. We can fill information.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 85,
    decision: "GO",
    statement: "Currently a range, but near breakeven, so test value is high. Quick verification with small sample is the answer.",
    categoryHints: ["home", "pet", "stationery_office"],
  },
  {
    id: 86,
    decision: "GO",
    statement: "Once origin is confirmed, unit cost and lead time stabilize. We can drive to confirmation document-based.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 87,
    decision: "GO",
    statement: "Product point is clear, making marketing easy too. Once factory is secured, execution is possible immediately.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 88,
    decision: "GO",
    statement: "Price compression opportunity exists, with large improvement margin. Just comparing candidate factories can lower unit cost significantly.",
    categoryHints: ["electronics", "apparel", "home"],
  },
  {
    id: 89,
    decision: "GO",
    statement: "This case has meaning even with weak data. We find evidence fast, so results come quickly.",
    categoryHints: ["food", "beauty", "home"],
  },
  {
    id: 90,
    decision: "GO",
    statement: "Insufficient now, but once upload quality improves, report completes. Just follow re-shooting guide.",
    categoryHints: ["food", "beauty", "home"],
  },
  
  // HOLD verdicts (91-96)
  {
    id: 91,
    decision: "HOLD",
    statement: "Conclusion isn't bad, but one key piece of evidence is still missing. Once barcode is readable, fast conversion to GO is possible.",
    categoryHints: ["food", "beauty", "electronics"],
  },
  {
    id: 92,
    decision: "HOLD",
    statement: "If factory candidates emerge in small numbers, unit cost may fluctuate. Keyword organization is needed to expand candidate pool.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 93,
    decision: "HOLD",
    statement: "HS candidates are 2, so conservative approach now. Must narrow to one by confirming ingredients and materials.",
    categoryHints: ["food", "beauty", "hybrid"],
  },
  {
    id: 94,
    decision: "HOLD",
    statement: "Pack unit is unclear, making logistics calculation weak. Once units per case are confirmed, it stabilizes.",
    categoryHints: ["food", "beauty", "packaging"],
  },
  {
    id: 95,
    decision: "HOLD",
    statement: "Regulatory risk isn't zero, but it's manageable. Once labeling and ingredients are confirmed, proceeding is possible.",
    categoryHints: ["food", "beauty"],
  },
  {
    id: 96,
    decision: "HOLD",
    statement: "It's not weak data now, but weak inputs. We can find it, so strengthen inputs first.",
    categoryHints: ["food", "beauty", "home"],
  },
  
  // NO verdicts (97-99)
  {
    id: 97,
    decision: "NO",
    statement: "Price is hard to match in current structure, and improvement room is small. Switching to different product is faster.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 98,
    decision: "NO",
    statement: "Proceeding without verification risks accumulating risk costs. Not recommended if verification budget doesn't exist.",
    categoryHints: ["electronics", "apparel", "industrial"],
  },
  {
    id: 99,
    decision: "NO",
    statement: "Both matching and classification are ambiguous in this combination. This is a time-consuming type, so lowering priority is correct.",
    categoryHints: ["electronics", "hybrid", "industrial"],
  },
  
  // GO verdict (100)
  {
    id: 100,
    decision: "GO",
    statement: "Weak data is actually an opportunity. The moment we find and attach evidence, we can confirm and move faster than competitors.",
    categoryHints: ["food", "beauty", "home"],
  },
];

/**
 * Select appropriate verdict template based on decision, category, and data quality
 */
export function selectVerdictTemplate(
  decision: "GO" | "HOLD" | "NO",
  category: string,
  dataQuality: {
    supplierMatches: number;
    exactMatches: number;
    hasBarcode: boolean;
    hasLabel: boolean;
    hasWeight: boolean;
    hasOrigin: boolean;
  }
): VerdictTemplate {
  // Filter templates by decision
  const candidates = VERDICT_TEMPLATES.filter((t) => t.decision === decision);
  
  // Score templates based on category match and data quality
  const scored = candidates.map((template) => {
    let score = 0;
    
    // Category match bonus
    if (template.categoryHints?.includes(category.toLowerCase())) {
      score += 10;
    }
    
    // Data quality alignment
    if (dataQuality.exactMatches >= 3 && template.id <= 20) {
      score += 5; // Early GO templates favor strong matches
    }
    if (dataQuality.supplierMatches === 0 && template.id >= 81 && template.id <= 90) {
      score += 5; // Later GO templates handle no matches
    }
    if (!dataQuality.hasLabel && template.id >= 51 && template.id <= 60) {
      score += 3; // Templates that mention label issues
    }
    if (!dataQuality.hasBarcode && (template.id === 1 || template.id === 8 || template.id === 91)) {
      score += 3; // Templates that mention barcode
    }
    
    return { template, score };
  });
  
  // Sort by score and pick top, or random if tied
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0]?.score || 0;
  const topCandidates = scored.filter((s) => s.score === topScore);
  
  // Return top candidate, or random from top if multiple
  const selected = topCandidates.length > 1
    ? topCandidates[Math.floor(Math.random() * topCandidates.length)]
    : topCandidates[0] || scored[0];
  
  return selected?.template || candidates[0] || VERDICT_TEMPLATES[0];
}

