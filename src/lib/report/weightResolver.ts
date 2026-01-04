/**
 * Unit Weight Resolver
 * Resolves unit weight from multiple sources with priority:
 * 1. User input
 * 2. Label parsed net weight
 * 3. Gemini Vision inference
 * 4. Category default
 */

export interface UnitWeightResult {
  grams: number;
  rangeGrams: { min: number; max: number };
  source: "user" | "label" | "gemini_photo" | "category_default";
  confidence: number; // 0..1
  rationale: string;
}

interface ReportContext {
  reportId: string;
  inputStatus?: any;
  labelText?: string;
  productImageUrl?: string;
  labelImageUrl?: string;
  category?: string;
  baseline?: any;
}

/**
 * Create a stable hash from reportId
 */
function stableHash(reportId: string): number {
  let hash = 0;
  for (let i = 0; i < reportId.length; i++) {
    const char = reportId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Category default weights (in grams)
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  candy: 50,
  snack: 30,
  toy: 100,
  novelty: 80,
  combo: 60,
  food: 100,
  beverage: 250,
  beauty: 150,
  home: 200,
  electronics: 300,
  apparel: 150,
  default: 100,
};

/**
 * Parse weight from label text
 */
function parseLabelWeight(labelText: string): { grams: number; rationale: string } | null {
  if (!labelText) return null;
  
  const text = labelText.toLowerCase();
  const weightPatterns = [
    // "Net Wt 140 g", "NET WEIGHT: 5 oz"
    /net\s*(?:wt|weight)[:\s]*(\d+(?:\.\d+)?)\s*(g|kg|oz|lb|grams?|kilograms?|ounces?|pounds?)/i,
    // "140g", "0.14 kg"
    /(\d+(?:\.\d+)?)\s*(g|kg|oz|lb|grams?|kilograms?|ounces?|pounds?)(?!\s*per)/i,
    // "Weight: 140 g"
    /weight[:\s]*(\d+(?:\.\d+)?)\s*(g|kg|oz|lb|grams?|kilograms?|ounces?|pounds?)/i,
  ];
  
  const foundWeights: Array<{ grams: number; match: string }> = [];
  
  for (const pattern of weightPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern.source, 'gi'))];
    for (const match of matches) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      let grams = 0;
      if (unit.startsWith('g')) {
        grams = value;
      } else if (unit.startsWith('kg')) {
        grams = value * 1000;
      } else if (unit.startsWith('oz')) {
        grams = value * 28.35;
      } else if (unit.startsWith('lb')) {
        grams = value * 453.6;
      }
      
      if (grams > 0 && grams <= 5000) {
        foundWeights.push({ grams: Math.round(grams), match: match[0] });
      }
    }
  }
  
  if (foundWeights.length === 0) return null;
  
  // If multiple weights, pick the one closest to typical net weight (10-500g range)
  const typicalRange = { min: 10, max: 500 };
  let bestWeight = foundWeights[0];
  let bestScore = Math.abs(bestWeight.grams - (typicalRange.min + typicalRange.max) / 2);
  
  for (const weight of foundWeights) {
    if (weight.grams >= typicalRange.min && weight.grams <= typicalRange.max) {
      const score = Math.abs(weight.grams - (typicalRange.min + typicalRange.max) / 2);
      if (score < bestScore) {
        bestWeight = weight;
        bestScore = score;
      }
    }
  }
  
  return {
    grams: bestWeight.grams,
    rationale: `Parsed from label: "${bestWeight.match}"`,
  };
}

/**
 * Convert image URL to base64 data URL if needed
 */
async function getImageData(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  
  // If already a data URL, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it's a public URL, try to fetch and convert to base64
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn('[WeightResolver] Failed to fetch image:', error);
    return null;
  }
}

/**
 * Call Gemini Vision to infer weight from photos
 * Uses existing Gemini integration if available, otherwise returns null
 */
async function inferWeightFromGemini(
  productImageUrl: string | null | undefined,
  labelImageUrl: string | null | undefined,
  reportId: string,
  context?: {
    productName?: string;
    category?: string;
    unitsPerPack?: number;
    notes?: string;
  }
): Promise<{
  unit_weight_grams: number | null;
  min_grams: number | null;
  max_grams: number | null;
  confidence: number;
  signals: string[];
  reason: string;
  unit_scope?: "outer_pack" | "inner_unit" | "unknown";
  pack_count?: number | null;
  pack_count_confidence?: number;
} | null> {
  if (!productImageUrl && !labelImageUrl) {
    return null;
  }
  
  try {
    // Use Gemini API if available
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('[WeightResolver] Gemini API key not configured');
      return null;
    }
    
    // Try to import Gemini SDK
    let GoogleGenerativeAI: any;
    try {
      const geminiModule = await import('@google/generative-ai');
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
    } catch (importError) {
      console.warn('[WeightResolver] @google/generative-ai not installed, skipping Gemini inference');
      return null;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Convert image URLs to base64 data URLs
    const productImageData = await getImageData(productImageUrl);
    const labelImageData = await getImageData(labelImageUrl);
    
    const imageParts: any[] = [];
    if (productImageData) {
      // Extract mime type and base64 from data URL
      const match = productImageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    if (labelImageData && labelImageData !== productImageData) {
      const match = labelImageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    
    if (imageParts.length === 0) {
      console.warn('[WeightResolver] No valid images to process');
      return null;
    }
    
    // Build context hints
    const contextHints = [];
    if (context?.productName) {
      contextHints.push(`productName: ${context.productName}`);
    }
    if (context?.category) {
      contextHints.push(`category: ${context.category}`);
    }
    if (context?.unitsPerPack) {
      contextHints.push(`unitsPerPack: ${context.unitsPerPack}`);
    }
    if (context?.notes) {
      contextHints.push(`notes: ${context.notes}`);
    }
    
    const prompt = `SYSTEM
You are a careful vision analyst for retail import products.
Your goal is to estimate the weight of one retail unit that the user would import and sell.
You must avoid hallucinating printed numbers.
If you cannot clearly read a net weight printed on the package, do not output a single exact weight.
Output only valid JSON and nothing else.

Definition of unit
Unit means one sellable retail unit as pictured, such as one pouch, one box, one blister pack.
If the photo shows a carton or multipack, treat the whole outer pack as the unit unless the package clearly states per piece weight.

Hard rules
Never invent a printed net weight.
Only treat a number as printed if it is clearly visible and you are confident you read it correctly.
If printed net weight is not clearly visible, use an estimated range only.
If you are unsure whether the printed number is net weight or something else, do not use it as net weight.
Do not use serving size or nutrition table amounts as net weight.
Do not use model numbers, item counts, or volumes as weight.

Multipack and unit scope rules
You must decide the unit scope.
If the image shows a multipack, assortment box, or a bag containing multiple inner packs:
- Default unit_scope is "outer_pack" meaning the whole multipack is the unit.
- Only set unit_scope to "inner_unit" if the pack count is clearly printed AND you can justify that the weight applies per inner unit or provides a breakdown.
- Never divide weight using serving size, nutrition servings, or piece counts of candies/toys.
- If you cannot confirm pack count and scope, set unit_scope "unknown" and return only an estimated range for the outer pack.

Add these output keys
unit_scope: "outer_pack" | "inner_unit" | "unknown"
pack_count: number | null
pack_count_confidence: number (0..1)

If unit_scope is "inner_unit", you must explain exactly where the pack count is visible.
If not clearly visible, keep outer_pack or unknown.

Output format
Return a JSON object with these keys:
unit_weight_grams
min_grams
max_grams
confidence
signals
reason
unit_scope
pack_count
pack_count_confidence

Validation rules
If you provide unit_weight_grams, it must be between 1 and 5000.
min_grams and max_grams must be between 1 and 5000.
min_grams must be less than or equal to max_grams.
If unit_weight_grams is provided, it must be within the min and max range.
If you cannot infer anything, set unit_weight_grams null, min_grams null, max_grams null, confidence 0, and explain in reason.

Signals allowed
printed_net_weight_visible
printed_weight_ambiguous
multipack_or_carton
single_retail_unit
scale_display_visible
only_size_cues
conflicting_weights_on_pack
no_readable_weight_text

Confidence guidance
0.90 to 1.00 only if printed net weight is clearly readable
0.60 to 0.85 if you can infer from strong cues but not a readable print
0.20 to 0.55 if you only have weak size cues
0.00 if you cannot infer

Range guidance
If printed net weight is clearly readable, set min and max close to the value, within about 5 percent.
If inferred from cues, set a wider range, about 15 to 35 percent depending on confidence.

Reason requirements
In reason, mention exactly what you used:
Either the printed net weight text you saw and where it appeared
Or the cues used for inference and why the range is wide

USER
Estimate the unit weight for this product.
Use the images provided.
${contextHints.length > 0 ? `Context hints:\n${contextHints.join('\n')}` : ''}
Remember
If net weight is not clearly readable, do not output a single exact weight. Use a range and low confidence.
Return only JSON.`;
    
    const result = await model.generateContent([...imageParts, prompt]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    let jsonText = text.trim();
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const data = JSON.parse(jsonText);
    
    // Validate response
    if (data.unit_weight_grams !== null && typeof data.unit_weight_grams === 'number') {
      const grams = Math.max(1, Math.min(5000, Math.round(data.unit_weight_grams)));
      const min = data.min_grams !== null && typeof data.min_grams === 'number'
        ? Math.max(1, Math.min(5000, Math.round(data.min_grams)))
        : Math.round(grams * 0.95); // Default 5% range if printed weight
      const max = data.max_grams !== null && typeof data.max_grams === 'number'
        ? Math.max(1, Math.min(5000, Math.round(data.max_grams)))
        : Math.round(grams * 1.05); // Default 5% range if printed weight
      
      if (min <= grams && grams <= max) {
        return {
          unit_weight_grams: grams,
          min_grams: min,
          max_grams: max,
          confidence: Math.max(0, Math.min(1, typeof data.confidence === 'number' ? data.confidence : 0.5)),
          signals: Array.isArray(data.signals) ? data.signals : [],
          reason: typeof data.reason === 'string' ? data.reason : 'Inferred from product photos',
        };
      }
    }
    
    // If only range is provided (no exact weight)
    if (data.min_grams !== null && data.max_grams !== null && 
        typeof data.min_grams === 'number' && typeof data.max_grams === 'number') {
      const min = Math.max(1, Math.min(5000, Math.round(data.min_grams)));
      const max = Math.max(1, Math.min(5000, Math.round(data.max_grams)));
      if (min <= max) {
        const mid = Math.round((min + max) / 2);
        return {
          unit_weight_grams: mid,
          min_grams: min,
          max_grams: max,
          confidence: Math.max(0, Math.min(1, typeof data.confidence === 'number' ? data.confidence : 0.5)),
          signals: Array.isArray(data.signals) ? data.signals : [],
          reason: typeof data.reason === 'string' ? data.reason : 'Estimated from visual cues',
          unit_scope: (data.unit_scope === "outer_pack" || data.unit_scope === "inner_unit" || data.unit_scope === "unknown") 
            ? data.unit_scope 
            : "unknown",
          pack_count: typeof data.pack_count === 'number' ? data.pack_count : null,
          pack_count_confidence: typeof data.pack_count_confidence === 'number' 
            ? Math.max(0, Math.min(1, data.pack_count_confidence)) 
            : 0,
        };
      }
    }
    
    // Invalid response - return null
    return {
      unit_weight_grams: null,
      min_grams: null,
      max_grams: null,
      confidence: 0,
      signals: [],
      reason: typeof data.reason === 'string' ? data.reason : 'Unable to infer weight from photos',
      unit_scope: "unknown",
      pack_count: null,
      pack_count_confidence: 0,
    };
  } catch (error) {
    console.warn('[WeightResolver] Gemini Vision inference failed:', error);
    return null;
  }
}

/**
 * Resolve unit weight with priority
 */
export async function resolveUnitWeight(reportContext: ReportContext): Promise<UnitWeightResult> {
  const { reportId, inputStatus, labelText, productImageUrl, labelImageUrl, category, baseline } = reportContext;
  
  // Priority A: User input weight
  if (inputStatus?.weightGrams && inputStatus?.weightDefaultUsed === false) {
    const grams = Number(inputStatus.weightGrams);
    if (grams > 0 && grams <= 5000) {
      return {
        grams: Math.round(grams),
        rangeGrams: {
          min: Math.round(grams * 0.82),
          max: Math.round(grams * 1.18),
        },
        source: "user",
        confidence: 1.0,
        rationale: "User provided weight",
      };
    }
  }
  
  // Priority B: Label parsed net weight
  const parsedWeight = parseLabelWeight(labelText || '');
  if (parsedWeight) {
    return {
      grams: parsedWeight.grams,
      rangeGrams: {
        min: Math.round(parsedWeight.grams * 0.82),
        max: Math.round(parsedWeight.grams * 1.18),
      },
      source: "label",
      confidence: 0.95,
      rationale: parsedWeight.rationale,
    };
  }
  
  // Priority C: Gemini Vision inference
  const geminiResult = await inferWeightFromGemini(
    productImageUrl, 
    labelImageUrl, 
    reportId,
    {
      productName: (reportContext as any).productName || baseline?.productName,
      category: category,
      unitsPerPack: baseline?.unitsPerCase || baseline?.unitsPerPack,
      notes: baseline?.notes,
    }
  );
  if (geminiResult && geminiResult.unit_weight_grams !== null) {
    // Handle unit_scope: if unknown, default to outer_pack
    const unitScope = geminiResult.unit_scope === "unknown" ? "outer_pack" : (geminiResult.unit_scope || "outer_pack");
    
    return {
      grams: geminiResult.unit_weight_grams,
      rangeGrams: {
        min: geminiResult.min_grams || Math.round(geminiResult.unit_weight_grams * 0.82),
        max: geminiResult.max_grams || Math.round(geminiResult.unit_weight_grams * 1.18),
      },
      source: "gemini_photo",
      confidence: geminiResult.confidence,
      rationale: geminiResult.reason || `Inferred from photos: ${geminiResult.signals.join(', ')}`,
      // Store multipack metadata for next action logic
      unitScope: unitScope,
      packCount: geminiResult.pack_count,
      packCountConfidence: geminiResult.pack_count_confidence || 0,
    };
  }
  
  // Priority D: Category default with deterministic jitter
  const categoryLower = (category || 'default').toLowerCase();
  let baseWeight = CATEGORY_WEIGHTS.default;
  for (const [key, value] of Object.entries(CATEGORY_WEIGHTS)) {
    if (categoryLower.includes(key)) {
      baseWeight = value;
      break;
    }
  }
  
  const hash = stableHash(reportId);
  const jitter = ((hash % 17) / 100) - 0.08; // Range: -0.08 to 0.08
  const grams = Math.round(baseWeight * (1 + jitter));
  
  return {
    grams,
    rangeGrams: {
      min: Math.round(grams * 0.7), // Wider range for defaults
      max: Math.round(grams * 1.5),
    },
    source: "category_default",
    confidence: 0.3,
    rationale: `Estimated from ${categoryLower} category with deterministic variation`,
  };
}

