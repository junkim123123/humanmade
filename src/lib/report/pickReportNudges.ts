/**
 * Deterministic Report Nudges
 * Picks exactly one action and one photo retake tip based on report signals
 * Uses reportId hash for stable output per report
 */

export interface ReportNudge {
  actionKey: string;
  actionText: string;
  tipText: string;
  severity: "high" | "medium" | "low";
  target: "barcode" | "label" | "weight" | "box" | "origin" | "name" | "pricing" | "general";
}

interface ActionDefinition {
  key: string;
  priority: number;
  target: ReportNudge["target"];
  actionText: string;
  tipText: string;
  severity: ReportNudge["severity"];
  condition: (flags: ActionFlags, category: string) => boolean;
}

interface ActionFlags {
  labelMissingOrUnreadable: boolean;
  barcodeMissingOrUnreadable: boolean;
  weightDefaultUsed: boolean;
  boxOrCaseDefaultUsed: boolean;
  originMissingOrUnreadable: boolean;
  supplierMatchesEmpty: boolean;
  hsMissing: boolean;
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
 * Action catalog with priorities and conditions
 */
const ACTION_CATALOG: ActionDefinition[] = [
  {
    key: "weight_scale_photo",
    priority: 0.5, // Higher priority than label_retake
    target: "weight",
    severity: "high",
    actionText: "Upload a photo of the item on a scale",
    tipText: "Place item on a scale and capture the display clearly.",
    condition: (flags, category) => {
      // Check if weight source is gemini_photo with low confidence or category_default
      // This will be checked in pickReportNudge function
      return false; // Will be set dynamically
    },
  },
  {
    key: "label_retake",
    priority: 1,
    target: "label",
    severity: "high",
    actionText: "Upload a clear label photo to unlock HS code, origin, and supplier matches.",
    tipText: "Place the package flat, avoid glare, fill the frame, capture ingredients, origin, and net weight in one shot.",
    condition: (flags, category) => flags.labelMissingOrUnreadable,
  },
  {
    key: "barcode_retake",
    priority: 2,
    target: "barcode",
    severity: "high",
    actionText: "Upload a clear barcode close up to trigger exact import matches.",
    tipText: "Move closer until digits are sharp, tap to focus, keep the barcode straight, include the numbers below the bars.",
    condition: (flags, category) => flags.barcodeMissingOrUnreadable,
  },
  {
    key: "origin_confirm",
    priority: 3,
    target: "origin",
    severity: "high",
    actionText: "Confirm the origin line to lock duty and compliance.",
    tipText: "Capture the origin statement in focus, include the nearby ingredients panel for context.",
    condition: (flags, category) => flags.originMissingOrUnreadable,
  },
  {
    key: "weight_confirm",
    priority: 4,
    target: "weight",
    severity: "medium",
    actionText: "Enter the net weight to tighten shipping and margin.",
    tipText: "Put the item on a scale and upload a photo showing the weight reading.",
    condition: (flags, category) => flags.weightDefaultUsed,
  },
  {
    key: "case_pack_confirm",
    priority: 5,
    target: "box",
    severity: "medium",
    actionText: "Confirm units per case to stabilize landed cost.",
    tipText: "Photograph the carton markings or count packs and upload a single clear shot.",
    condition: (flags, category) => flags.boxOrCaseDefaultUsed,
  },
  {
    key: "hs_unlock",
    priority: 6,
    target: "label",
    severity: "medium",
    actionText: "Upload label ingredients to unlock HS classification.",
    tipText: "Capture ingredients and nutrition facts sharply, keep the text readable edge to edge.",
    condition: (flags, category) => flags.hsMissing,
  },
  {
    key: "add_anchor",
    priority: 7,
    target: "name",
    severity: "low",
    actionText: "Add a front package photo with brand and product name to improve matching.",
    tipText: "Shoot the front panel straight on, include brand logo and full product name, no perspective tilt.",
    condition: (flags, category) => flags.supplierMatchesEmpty && !flags.barcodeMissingOrUnreadable,
  },
  {
    key: "general_improve",
    priority: 8,
    target: "general",
    severity: "low",
    actionText: "One clear photo is enough. Upload a sharper barcode or label to boost confidence.",
    tipText: "Use bright light, steady hands, and fill the frame. Blurry text blocks matching.",
    condition: () => true, // Always available as fallback
  },
];

/**
 * Compute action flags from report data
 */
function computeFlags(report: any): ActionFlags {
  const inputStatus = report.inputStatus || report.data?.inputStatus || report._proof?.inputStatus || report.extras?.inputStatus || {};
  
  // Label missing or unreadable
  const labelMissingOrUnreadable = !inputStatus.labelPhotoUploaded || 
    inputStatus.labelOcrStatus === "failed" || 
    inputStatus.labelOcrStatus === "FAILED" ||
    !inputStatus.labelTextPresent;
  
  // Barcode missing or unreadable
  const barcodeMissingOrUnreadable = !inputStatus.barcodePhotoUploaded || 
    !inputStatus.barcodeDecoded ||
    !inputStatus.barcodeValue;
  
  // Weight default used
  const weightDefaultUsed = inputStatus.weightDefaultUsed === true || 
    !inputStatus.weightGrams ||
    (inputStatus.weightGrams && inputStatus.weightDefaultUsed !== false);
  
  // Box or case default used
  const boxOrCaseDefaultUsed = inputStatus.boxSizeDefaultUsed === true ||
    !inputStatus.unitsPerCase ||
    inputStatus.unitsPerCase === 1; // Often default
  
  // Origin missing or unreadable
  const originMissingOrUnreadable = !inputStatus.originConfirmed ||
    !inputStatus.originCountry ||
    (inputStatus.originCountry && inputStatus.originDefaultUsed === true);
  
  // Supplier matches empty
  const supplierMatches = report._supplierMatches || 
    (report._recommendedMatches || []).concat(report._candidateMatches || []) || 
    [];
  const supplierMatchesEmpty = supplierMatches.length === 0;
  
  // HS missing
  const hsMissing = !report._hs && 
    (!report._hsCandidates || report._hsCandidates.length === 0);
  
  return {
    labelMissingOrUnreadable,
    barcodeMissingOrUnreadable,
    weightDefaultUsed,
    boxOrCaseDefaultUsed,
    originMissingOrUnreadable,
    supplierMatchesEmpty,
    hsMissing,
  };
}

/**
 * Adjust priorities based on category
 */
function adjustPriorities(
  actions: ActionDefinition[],
  category: string
): ActionDefinition[] {
  const categoryLower = category.toLowerCase();
  
  // Food/candy/snack/confectionery: boost label and origin
  if (categoryLower.includes("food") || 
      categoryLower.includes("candy") || 
      categoryLower.includes("snack") || 
      categoryLower.includes("confectionery")) {
    return actions.map(action => {
      if (action.key === "label_retake") {
        return { ...action, priority: action.priority - 0.5 };
      }
      if (action.key === "origin_confirm") {
        return { ...action, priority: action.priority - 0.3 };
      }
      return action;
    });
  }
  
  // Toy/novelty/accessory: boost barcode and anchor
  if (categoryLower.includes("toy") || 
      categoryLower.includes("novelty") || 
      categoryLower.includes("accessory")) {
    return actions.map(action => {
      if (action.key === "barcode_retake") {
        return { ...action, priority: action.priority - 0.5 };
      }
      if (action.key === "add_anchor") {
        return { ...action, priority: action.priority - 0.3 };
      }
      return action;
    });
  }
  
  // Combo/hybrid: prioritize label first
  if (categoryLower.includes("combo") || categoryLower.includes("hybrid")) {
    return actions.map(action => {
      if (action.key === "label_retake") {
        return { ...action, priority: action.priority - 0.5 };
      }
      return action;
    });
  }
  
  return actions;
}

/**
 * Pick exactly one nudge deterministically
 */
export function pickReportNudge(report: any): ReportNudge {
  const reportId = report.id || report.reportId || "unknown";
  const category = report.category || report.baseline?.category || "unknown";
  
  // Compute flags
  const flags = computeFlags(report);
  
  // Check weight source and confidence for next action
  const unitWeight = report._inputs?.unitWeight || report.data?._inputs?.unitWeight;
  const weightConfidence = unitWeight?.confidence || 0;
  const unitScope = unitWeight?.unitScope || "unknown";
  const packCountConfidence = unitWeight?.packCountConfidence || 0;
  
  // Check for multipack uncertainty (higher priority than low confidence)
  const hasMultipackUncertainty = unitWeight?.source === "gemini_photo" && (
    unitScope === "unknown" || 
    (unitScope === "outer_pack" && packCountConfidence < 0.6) ||
    (unitScope === "inner_unit" && packCountConfidence < 0.6)
  );
  
  // Determine weight-related action based on confidence tiers
  let weightAction: ActionDefinition | null = null;
  
  if (hasMultipackUncertainty) {
    // Priority 1: Multipack uncertainty - show multipack confirmation
    weightAction = {
      key: "multipack_confirm",
      priority: 0.3, // Highest priority
      target: "weight",
      severity: "high",
      actionText: "Upload a photo showing the multipack structure to confirm unit count",
      tipText: "Show both the outer pack and individual inner packs clearly. Count how many inner units are inside.",
      condition: () => false, // Not used in filter
    };
  } else if (weightConfidence >= 0.85) {
    // Tier 1: High confidence - move to next priority
    // Don't show weight action, let other actions take priority
    weightAction = null;
  } else if (weightConfidence >= 0.55) {
    // Tier 2: Medium confidence - suggest confirmation
    weightAction = {
      key: "weight_confirm_medium",
      priority: 0.7,
      target: "weight",
      severity: "medium",
      actionText: "Confirm weight with label or scale photo to lock shipping cost and margin",
      tipText: "Capture the net weight section clearly, or place the unit on a scale showing the display.",
      condition: () => false,
    };
  } else {
    // Tier 3: Low confidence or category default - require scale photo
    weightAction = {
      key: "weight_scale_photo",
      priority: 0.5,
      target: "weight",
      severity: "high",
      actionText: "Upload a photo of the item on a scale",
      tipText: "Place item on a scale and capture the display clearly.",
      condition: () => false,
    };
  }
  
  const needsWeightAction = weightAction !== null;
  
  // Get all applicable actions
  let applicableActions = ACTION_CATALOG.filter(action => {
    // Skip weight actions from catalog - we'll add custom ones based on confidence
    if (action.key === "weight_scale_photo" || action.key === "weight_confirm") {
      return false;
    }
    return action.condition(flags, category);
  });
  
  // Add weight action if needed
  if (needsWeightAction && weightAction) {
    applicableActions.push(weightAction);
  }
  
  // Adjust priorities based on category
  applicableActions = adjustPriorities(applicableActions, category);
  
  // Sort by priority (lower is higher priority)
  applicableActions.sort((a, b) => a.priority - b.priority);
  
  // Find highest priority
  const highestPriority = applicableActions[0]?.priority || 999;
  const topCandidates = applicableActions.filter(a => a.priority === highestPriority);
  
  // Deterministic tie-breaking using reportId hash
  const hash = stableHash(reportId);
  const index = hash % topCandidates.length;
  const selected = topCandidates[index] || applicableActions[0] || ACTION_CATALOG[ACTION_CATALOG.length - 1];
  
  return {
    actionKey: selected.key,
    actionText: selected.actionText,
    tipText: selected.tipText,
    severity: selected.severity,
    target: selected.target,
  };
}

