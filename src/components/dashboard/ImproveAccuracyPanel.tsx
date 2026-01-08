// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ImageSlotData {
  file: File | null;
  preview: string | null;
}

interface ImproveAccuracyPanelProps {
  onFileSelect: (files: { barcode: File | null; label: File | null }) => void;
  uploading?: boolean;
  disabled?: boolean;
  hasImage?: boolean;
  confidence?: "high" | "medium" | "low";
}

const STORAGE_KEY = "improve-accuracy-expanded";

export function ImproveAccuracyPanel({
  onFileSelect,
  uploading = false,
  disabled = false,
  hasImage = false,
  confidence,
}: ImproveAccuracyPanelProps) {
  // Initialize from localStorage, default based on screen size and hasImage
  const [isExpanded, setIsExpanded] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    
    // Check if mobile (less than 1024px)
    const isMobile = window.innerWidth < 1024;
    
    // On mobile, default to collapsed
    if (isMobile) {
      return undefined;
    }
    
    // On desktop, check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === "true" ? "item-1" : undefined;
    }
    
    // If no stored preference and hasImage, default to open on desktop
    return hasImage ? "item-1" : undefined;
  });
  
  // Auto-expand on desktop when image is selected (but respect localStorage preference)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const isMobile = window.innerWidth < 1024;
    
    // On mobile, keep collapsed
    if (isMobile) {
      return;
    }
    
    // On desktop, if hasImage and no stored preference, open it
    if (hasImage && !localStorage.getItem(STORAGE_KEY)) {
      setIsExpanded("item-1");
    }
  }, [hasImage]);
  
  // Save to localStorage when expanded state changes (user interaction)
  const handleValueChange = (value: string | undefined) => {
    setIsExpanded(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value === "item-1" ? "true" : "false");
    }
  };
  
  const [slots, setSlots] = useState<{
    barcode: ImageSlotData;
    label: ImageSlotData;
  }>({
    barcode: { file: null, preview: null },
    label: { file: null, preview: null },
  });
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);
  const onFileSelectRef = useRef(onFileSelect);
  const prevBarcodeFileRef = useRef<File | null>(null);
  const prevLabelFileRef = useRef<File | null>(null);

  // Keep onFileSelect ref up to date
  useEffect(() => {
    onFileSelectRef.current = onFileSelect;
  }, [onFileSelect]);

  // Notify parent when slots change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevBarcodeFileRef.current = slots.barcode.file;
      prevLabelFileRef.current = slots.label.file;
      return;
    }

    // Only call if files actually changed
    const barcodeChanged = slots.barcode.file !== prevBarcodeFileRef.current;
    const labelChanged = slots.label.file !== prevLabelFileRef.current;

    if (barcodeChanged || labelChanged) {
      prevBarcodeFileRef.current = slots.barcode.file;
      prevLabelFileRef.current = slots.label.file;
      onFileSelectRef.current({
        barcode: slots.barcode.file,
        label: slots.label.file,
      });
    }
  }, [slots.barcode.file, slots.label.file]);

  const handleImageSelect = useCallback(
    (slotType: "barcode" | "label", file: File) => {
      const preview = URL.createObjectURL(file);
      setSlots((prev) => ({
        ...prev,
        [slotType]: { file, preview },
      }));
    },
    []
  );

  const handleImageRemove = useCallback(
    (slotType: "barcode" | "label") => {
      setSlots((prev) => {
        if (prev[slotType].preview) {
          URL.revokeObjectURL(prev[slotType].preview!);
        }
        return {
          ...prev,
          [slotType]: { file: null, preview: null },
        };
      });
    },
    []
  );


  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded}
      onValueChange={handleValueChange}
      className="w-full"
    >
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger
          disabled={disabled || uploading}
          className="text-sm font-medium text-slate-800 hover:no-underline py-2 disabled:opacity-50"
        >
          <span>
            Refine results <span className="text-slate-400 font-normal">(optional)</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Barcode slot */}
              <div
                onClick={() => {
                  if (!disabled && !uploading) {
                    barcodeInputRef.current?.click();
                  }
                }}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer",
                  slots.barcode.file
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                  (disabled || uploading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  ref={barcodeInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect("barcode", file);
                  }}
                  className="hidden"
                />
                {slots.barcode.file ? (
                  <div className="space-y-2">
                    <div className="relative aspect-square bg-slate-100 rounded overflow-hidden">
                      {slots.barcode.preview && (
                        <img
                          src={slots.barcode.preview}
                          alt="Barcode"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-700 truncate flex-1">
                        {slots.barcode.file.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageRemove("barcode");
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <ImageIcon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-600">Barcode or UPC</p>
                    <p className="text-xs text-slate-400 mt-0.5">Optional</p>
                  </div>
                )}
              </div>

              {/* Label slot */}
              <div
                onClick={() => {
                  if (!disabled && !uploading) {
                    labelInputRef.current?.click();
                  }
                }}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer",
                  slots.label.file
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                  (disabled || uploading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  ref={labelInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect("label", file);
                  }}
                  className="hidden"
                />
                {slots.label.file ? (
                  <div className="space-y-2">
                    <div className="relative aspect-square bg-slate-100 rounded overflow-hidden">
                      {slots.label.preview && (
                        <img
                          src={slots.label.preview}
                          alt="Label"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-700 truncate flex-1">
                        {slots.label.file.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageRemove("label");
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <ImageIcon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-600">Label or ingredients</p>
                    <p className="text-xs text-slate-400 mt-0.5">Optional</p>
                  </div>
                )}
              </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

