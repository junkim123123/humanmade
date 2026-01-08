// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Upload, Camera, Barcode, Ruler, Package } from "lucide-react";
import { useState } from "react";

interface FollowUpInputCardProps {
  analysisId?: string;
  productName?: string;
  category?: string;
  onInputSubmit?: (data: {
    barcode?: string;
    labelImage?: File;
    materialAndDimensions?: string;
  }) => void;
}

export function FollowUpInputCard({
  analysisId,
  productName,
  category,
  onInputSubmit,
}: FollowUpInputCardProps) {
  const [barcode, setBarcode] = useState("");
  const [labelImage, setLabelImage] = useState<File | null>(null);
  const [materialAndDimensions, setMaterialAndDimensions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!barcode && !labelImage && !materialAndDimensions) {
      return; // At least one field should be filled
    }

    setIsSubmitting(true);
    
    // Call parent handler if provided
    if (onInputSubmit) {
      onInputSubmit({
        barcode: barcode || undefined,
        labelImage: labelImage || undefined,
        materialAndDimensions: materialAndDimensions || undefined,
      });
    }

    // TODO: Save to API endpoint /api/quote with analysisId
    // For now, just show success message
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Additional information saved. It will be included with your quote request.");
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-sm border border-blue-200 p-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-600 rounded-xl">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Additional Information to Improve Accuracy
          </h3>
          <p className="text-sm text-slate-600">
            No similar internal records found. Labels and barcodes will significantly improve precision.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Barcode/UPC Input */}
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Barcode className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-slate-900">
              Barcode or UPC
            </label>
          </div>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g., 1234567890123"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Label Image Upload */}
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-slate-900">
              Back Label Photo
            </label>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLabelImage(file);
            }}
            className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {labelImage && (
            <p className="text-xs text-slate-500 mt-2">
              Selected: {labelImage.name}
            </p>
          )}
        </div>

        {/* Material and Dimensions */}
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-slate-900">
              Material and Dimensions
            </label>
          </div>
          <textarea
            value={materialAndDimensions}
            onChange={(e) => setMaterialAndDimensions(e.target.value)}
            placeholder="e.g., Plastic, 10cm x 5cm x 3cm, Weight 50g"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!barcode && !labelImage && !materialAndDimensions)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save and Include in Quote Request"}
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          This information will be sent to suppliers with your quote request.
        </p>
      </div>
    </motion.div>
  );
}

