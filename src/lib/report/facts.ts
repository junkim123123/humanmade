/**
 * Facts extraction for Confirmed from your upload panel
 * Extracts only evidence-backed facts from report data
 */

import type { Report } from "@/lib/report/types";
import { computeDataQuality } from "./data-quality";
import { resolveEffectiveWeight } from "./extraction-status";
import { normalizeEvidence } from "./evidence";

export type EvidenceType = "barcode" | "label" | "customs" | "user_input" | "vision";

export interface FactItem {
  id: string;
  label: string;
  value: string;
  evidenceType: EvidenceType;
  confidence: number;
  sourceRef?: string;
}

export interface MissingInfoItem {
  id: string;
  label: string;
  impact: "high" | "medium" | "low";
}

/**
 * Extract confirmed facts from report
 * Only facts with clear evidence are included
 */
export function extractConfirmedFacts(report: Report): FactItem[] {
  const facts: FactItem[] = [];
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || {};
  const labelDraft = inputStatus.labelDraft || {};
  const labelData = reportAny.pipeline_result?.analysis?.labelData || {};
  const effectiveWeight = resolveEffectiveWeight(report);

  // UPC from barcode
  if (inputStatus.barcodeExtractionStatus === "CONFIRMED" && inputStatus.barcode) {
    facts.push({
      id: "upc",
      label: "UPC recognized",
      value: inputStatus.barcode,
      evidenceType: inputStatus.barcodeExtractionSource === "OCR" ? "barcode" : "vision",
      confidence: 0.95,
      sourceRef: "Barcode photo",
    });
  }

  if (effectiveWeight.value && !facts.find((f) => f.id === "net_weight")) {
    let evidenceType: EvidenceType = "customs";
    let weightLabel = "Net weight assumed";
    let confidence = 0.65;
    let sourceRef = "Category inference";
    if (effectiveWeight.source === "confirmed") {
      evidenceType = "label";
      weightLabel = "Net weight verified";
      confidence = 0.85;
      sourceRef = "Label extraction";
    } else if (effectiveWeight.source === "inferred") {
      weightLabel = "Net weight inferred";
    }
    facts.push({
      id: "net_weight",
      label: weightLabel,
      value: `${effectiveWeight.value} g`,
      evidenceType,
      confidence,
      sourceRef,
    });
  }

  // Origin country from label
  if (labelDraft.originCountryDraft?.value && labelDraft.originCountryDraft?.source === "VISION") {
    facts.push({
      id: "origin",
      label: "Origin label present",
      value: labelDraft.originCountryDraft.value,
      evidenceType: "label",
      confidence: labelDraft.originCountryDraft.confidence || 0.8,
      sourceRef: "Label photo",
    });
  }

  // Brand from label
  if (labelDraft.brandDraft?.value && labelDraft.brandDraft?.source === "VISION") {
    facts.push({
      id: "brand",
      label: "Brand identified",
      value: labelDraft.brandDraft.value,
      evidenceType: "label",
      confidence: labelDraft.brandDraft.confidence || 0.8,
      sourceRef: "Label photo",
    });
  }

  if (labelData.material) {
    facts.push({
      id: "material",
      label: "Material identified",
      value: labelData.material,
      evidenceType: "label",
      confidence: 0.8,
      sourceRef: "Label text",
    });
  }

  if (labelData.dimensions || labelData.size) {
    facts.push({
      id: "dimensions",
      label: "Dimensions captured",
      value: labelData.dimensions || labelData.size,
      evidenceType: "label",
      confidence: 0.8,
      sourceRef: "Label text",
    });
  }

  // Retail price from user input
  if (reportAny.targetSellPrice && reportAny.targetSellPrice > 0) {
    facts.push({
      id: "shelf_price",
      label: "Retail price",
      value: `$${reportAny.targetSellPrice.toFixed(2)}`,
      evidenceType: "user_input",
      confidence: 1.0,
      sourceRef: "User input",
    });
  }

  // Destination from user (always present)
  facts.push({
    id: "destination",
    label: "Destination",
    value: "United States",
    evidenceType: "user_input",
    confidence: 1.0,
    sourceRef: "User input",
  });

  return facts;
}

/**
 * Generate missing info items
 * Shows what data is missing and would improve confidence
 */
export function extractMissingInfo(report: Report): MissingInfoItem[] {
  const evidence = normalizeEvidence(report as any);
  const { missingSignals } = computeDataQuality(report);
  const labelMap: Record<string, string> = {
    barcode: evidence.barcode.uploaded && !evidence.barcode.detected
      ? "Barcode photo unreadable"
      : "Barcode photo missing",
    unit_weight: evidence.label.uploaded
      ? "Weight not readable from label"
      : "Unit weight missing",
    origin: evidence.label.uploaded
      ? "Origin not readable"
      : "Origin missing",
    label_terms: evidence.label.uploaded
      ? "Label photo unreadable"
      : "Label photo missing",
    case_pack: "Units per case missing",
    material: "Material missing",
    dimensions: "Dimensions missing",
    brand_model: "Brand or model missing",
  };

  return missingSignals.map((signal) => ({
    id: signal.id,
    label: labelMap[signal.id] || `${signal.label} incomplete`,
    impact: signal.impact,
  }));
}
