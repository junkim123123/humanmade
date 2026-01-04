"use client";

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSlotData {
  file: File | null;
  preview: string | null;
  error?: string;
}

interface ThreeImageUploadProps {
  onFilesChange: (files: { 
    product: File | null; 
    barcode: File | null; 
    label: File | null;
    extra1: File | null;
    extra2: File | null;
  }) => void;
  disabled?: boolean;
  validationErrors?: {
    product?: string;
    barcode?: string;
    label?: string;
  };
}

export interface ThreeImageUploadHandle {
  scrollToFirstMissing: () => void;
}

export const ThreeImageUpload = forwardRef<ThreeImageUploadHandle, ThreeImageUploadProps>(
  ({ onFilesChange, disabled = false, validationErrors }, ref) => {
  const [slots, setSlots] = useState<{
    product: ImageSlotData;
    barcode: ImageSlotData;
    label: ImageSlotData;
    extra1: ImageSlotData;
    extra2: ImageSlotData;
  }>({
    product: { file: null, preview: null },
    barcode: { file: null, preview: null },
    label: { file: null, preview: null },
    extra1: { file: null, preview: null },
    extra2: { file: null, preview: null },
  });

  const [showOptional, setShowOptional] = useState(false);

  const productInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const extra1InputRef = useRef<HTMLInputElement>(null);
  const extra2InputRef = useRef<HTMLInputElement>(null);
  
  const productSlotRef = useRef<HTMLDivElement>(null);
  const barcodeSlotRef = useRef<HTMLDivElement>(null);
  const labelSlotRef = useRef<HTMLDivElement>(null);
  
  const isInitialMount = useRef(true);
  const onFilesChangeRef = useRef(onFilesChange);

  useImperativeHandle(ref, () => ({
    scrollToFirstMissing: () => {
      if (!slots.product.file && productSlotRef.current) {
        productSlotRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // barcode and label are optional, so don't scroll to them
    }
  }));

  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onFilesChangeRef.current({
      product: slots.product.file,
      barcode: slots.barcode.file,
      label: slots.label.file,
      extra1: slots.extra1.file,
      extra2: slots.extra2.file,
    });
  }, [slots]);

  const handleFileSelect = useCallback(
    (slotType: "product" | "barcode" | "label" | "extra1" | "extra2", file: File) => {
      // Validation: max 10MB, valid image type
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setSlots((prev) => ({
          ...prev,
          [slotType]: { 
            file: null, 
            preview: null, 
            error: "File is too large. Max 10 MB." 
          },
        }));
        return;
      }

      // Check MIME type - handle HEIC gracefully
      const isHEIC = file.type === "image/heic" || file.type === "image/heif";
      if (!VALID_TYPES.includes(file.type)) {
        if (isHEIC) {
          setSlots((prev) => ({
            ...prev,
            [slotType]: { 
              file: null, 
              preview: null, 
              error: "HEIC format not supported. Use screenshot or change camera format to JPEG." 
            },
          }));
        } else {
          setSlots((prev) => ({
            ...prev,
            [slotType]: { 
              file: null, 
              preview: null, 
              error: "Only image files (JPEG, PNG, WebP, GIF) allowed." 
            },
          }));
        }
        return;
      }

      // File is valid, create preview and store
      const preview = URL.createObjectURL(file);
      setSlots((prev) => {
        if (prev[slotType].preview) {
          URL.revokeObjectURL(prev[slotType].preview!);
        }
        return {
          ...prev,
          [slotType]: { file, preview, error: undefined },
        };
      });
    },
    []
  );

  const handleFileRemove = useCallback((slotType: "product" | "barcode" | "label" | "extra1" | "extra2") => {
    setSlots((prev) => {
      if (prev[slotType].preview) {
        URL.revokeObjectURL(prev[slotType].preview!);
      }
      return {
        ...prev,
        [slotType]: { file: null, preview: null, error: undefined },
      };
    });
  }, []);

  const handleDrop = useCallback(
    (slotType: "product" | "barcode" | "label" | "extra1" | "extra2", e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(slotType, file);
      }
    },
    [disabled, handleFileSelect]
  );

  const handlePaste = useCallback(
    (slotType: "product" | "barcode" | "label" | "extra1" | "extra2", e: React.ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(slotType, file);
            break;
          }
        }
      }
    },
    [disabled, handleFileSelect]
  );

  const renderSlot = (
    slotType: "product" | "barcode" | "label" | "extra1" | "extra2",
    label: string,
    helperText: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    slotRef?: React.RefObject<HTMLDivElement | null>,
    isRequired = false,
    tooltipText?: string
  ) => {
    const slot = slots[slotType];
    const hasImage = !!slot.file;
    const validationError = slot.error;
    const submissionError = isRequired ? validationErrors?.[slotType as "product" | "barcode" | "label"] : undefined;
    const hasAnyError = validationError || submissionError;

    return (
      <div ref={slotRef} className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[14px] font-semibold text-slate-900">{label}</h4>
            {isRequired && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                Required
              </span>
            )}
            {!isRequired && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                Optional
              </span>
            )}
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">{helperText}</p>
          {tooltipText && (
            <p className="mt-1 text-[12px] text-slate-500 italic">{tooltipText}</p>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "relative rounded-xl border transition-colors overflow-hidden group flex-1 flex items-center justify-center",
            hasImage
              ? "border-emerald-300 bg-emerald-50/50"
              : hasAnyError
              ? "border-red-300 bg-red-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
          )}
          onDrop={(e) => handleDrop(slotType, e)}
          onDragOver={(e) => e.preventDefault()}
          onPaste={(e) => handlePaste(slotType, e)}
        >
          {hasImage && slot.preview ? (
            <div className="relative w-full h-full min-h-[200px]">
              <img src={slot.preview} alt={label} className="h-full w-full object-contain p-3" />
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleFileRemove(slotType)}
                  disabled={disabled}
                  className="rounded-full bg-white border border-slate-200 p-1.5 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <div className="rounded-lg bg-slate-200 p-3">
                <ImageIcon className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-[13px] text-slate-500">Drop, paste, or browse</p>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(slotType, file);
              }
            }}
            disabled={disabled}
          />
        </div>

        {/* Error Messages */}
        {(validationError || submissionError) && (
          <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
            <p className="text-[12px] text-red-700 font-medium">
              {validationError || submissionError}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-l-4 border-slate-900 pl-4">
        <h3 className="text-[18px] font-bold text-slate-900">Product photos</h3>
        <p className="mt-1 text-[14px] text-slate-600">Upload a product photo to start. Barcode and label photos are optional but recommended for accuracy.</p>
        <p className="mt-0.5 text-[13px] text-slate-500">3 minutes. Assumptions are always labeled.</p>
      </div>
      
      {/* Upload Grid */}
      <div className="grid gap-5 sm:grid-cols-3">
        {renderSlot("product", "Product photo", "Clear front photo of the product or package. Make the name readable.", productInputRef, productSlotRef, true)}
        {renderSlot("barcode", "Barcode photo (optional)", "UPC or EAN close-up. Avoid glare. Fill the frame.", barcodeInputRef, barcodeSlotRef, false, "Barcode/Label highly recommended for accuracy, but not required.")}
        {renderSlot("label", "Label photo (optional)", "Back label with net weight, materials, warnings, and origin if shown.", labelInputRef, labelSlotRef, false, "Barcode/Label highly recommended for accuracy, but not required.")}
      </div>

      {/* Optional Section */}
      <div className="pt-6 border-t border-slate-200">
        {!showOptional ? (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add extra photos (optional)
          </button>
        ) : (
          <div className="space-y-5">
            <div className="border-l-4 border-amber-400 pl-4">
              <h3 className="text-[16px] font-semibold text-slate-900">Extra photos (optional)</h3>
              <p className="mt-1 text-[14px] text-slate-600">Helps with variants and inner packaging.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {renderSlot("extra1", "Packaging details", "Side of box, shipping label, or outer packaging.", extra1InputRef)}
              {renderSlot("extra2", "What's inside", "Close-up of the item, materials, or construction.", extra2InputRef)}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOptional(false);
                handleFileRemove("extra1");
                handleFileRemove("extra2");
              }}
              disabled={disabled}
              className="text-[13px] text-slate-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
            >
              Remove extra photos
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ThreeImageUpload.displayName = "ThreeImageUpload";
