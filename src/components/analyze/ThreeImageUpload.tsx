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

  // Gallery inputs (multiple selection, no capture)
  const productGalleryInputRef = useRef<HTMLInputElement>(null);
  const barcodeGalleryInputRef = useRef<HTMLInputElement>(null);
  const labelGalleryInputRef = useRef<HTMLInputElement>(null);
  const extra1GalleryInputRef = useRef<HTMLInputElement>(null);
  const extra2GalleryInputRef = useRef<HTMLInputElement>(null);
  
  // Camera inputs (single file, capture="environment")
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const barcodeCameraInputRef = useRef<HTMLInputElement>(null);
  const labelCameraInputRef = useRef<HTMLInputElement>(null);
  const extra1CameraInputRef = useRef<HTMLInputElement>(null);
  const extra2CameraInputRef = useRef<HTMLInputElement>(null);
  
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
    (slotType: "product" | "barcode" | "label" | "extra1" | "extra2", file: File | FileList) => {
      // Handle both single file and FileList (from multiple selection)
      const files = file instanceof FileList ? Array.from(file) : [file];
      // For now, use the first file (can be extended to support multiple later)
      const selectedFile = files[0];
      if (!selectedFile) return;
      // Validation: max 10MB, valid image type
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      
      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
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
      const isHEIC = selectedFile.type === "image/heic" || selectedFile.type === "image/heif";
      if (!VALID_TYPES.includes(selectedFile.type)) {
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
      const preview = URL.createObjectURL(selectedFile);
      setSlots((prev) => {
        if (prev[slotType].preview) {
          URL.revokeObjectURL(prev[slotType].preview!);
        }
        return {
          ...prev,
          [slotType]: { file: selectedFile, preview, error: undefined },
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
    galleryInputRef: React.RefObject<HTMLInputElement | null>,
    cameraInputRef: React.RefObject<HTMLInputElement | null>,
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
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm sm:text-base font-semibold text-slate-900">{label}</h4>
            {isRequired && (
              <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                Required
              </span>
            )}
            {!isRequired && (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Optional
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{helperText}</p>
          {tooltipText && (
            <p className="mt-1.5 text-xs text-slate-500">{tooltipText}</p>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "relative rounded-2xl border-2 transition-all overflow-hidden group flex-1 flex items-center justify-center shadow-sm",
            hasImage
              ? "border-emerald-300/60 bg-emerald-50/40 shadow-emerald-100/50"
              : hasAnyError
              ? "border-red-300/60 bg-red-50/40 shadow-red-100/50"
              : "border-slate-200/60 bg-white/70 backdrop-blur-sm hover:border-slate-300 hover:bg-white hover:shadow-md cursor-pointer"
          )}
          onDrop={(e) => handleDrop(slotType, e)}
          onDragOver={(e) => e.preventDefault()}
          onPaste={(e) => handlePaste(slotType, e)}
        >
          {hasImage && slot.preview ? (
            <div className="relative w-full h-full min-h-[240px] bg-white">
              <img src={slot.preview} alt={label} className="h-full w-full object-contain p-4" />
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={disabled}
                  className="rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleFileRemove(slotType)}
                  disabled={disabled}
                  className="rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md p-1.5 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 p-3 sm:p-4">
                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={disabled}
                  className="flex-1 rounded-xl bg-white border-2 border-slate-200 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow disabled:opacity-50 touch-manipulation"
                >
                  Choose photos
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled}
                  className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 touch-manipulation"
                >
                  Take photo
                </button>
              </div>
              <p className="text-xs text-slate-500">Or drop, paste files here</p>
            </div>
          )}
          {/* Gallery input (multiple selection, no capture) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const fileList = e.target.files;
              if (fileList && fileList.length > 0) {
                handleFileSelect(slotType, fileList);
              }
              // Reset input to allow selecting the same file again
              e.target.value = '';
            }}
            disabled={disabled}
          />
          {/* Camera input (single file, capture="environment") */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(slotType, file);
              }
              // Reset input to allow taking another photo
              e.target.value = '';
            }}
            disabled={disabled}
          />
        </div>

        {/* Error Messages */}
        {(validationError || submissionError) && (
          <div className="mt-3 p-3 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/60">
            <p className="text-xs text-red-700 font-semibold">
              {validationError || submissionError}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Product photos</h3>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Upload a product photo to start. Barcode and label photos are optional but recommended for accuracy.</p>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">3 minutes. Assumptions are always labeled.</p>
      </div>
      
      {/* Upload Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        {renderSlot("product", "Product photo", "Clear front photo of the product or package. Make the name readable.", productGalleryInputRef, productCameraInputRef, productSlotRef, true)}
        {renderSlot("barcode", "Barcode photo (optional)", "UPC or EAN close-up. Avoid glare. Fill the frame.", barcodeGalleryInputRef, barcodeCameraInputRef, barcodeSlotRef, false, "Barcode/Label highly recommended for accuracy, but not required.")}
        {renderSlot("label", "Label photo (optional)", "Back label with net weight, materials, warnings, and origin if shown.", labelGalleryInputRef, labelCameraInputRef, labelSlotRef, false, "Barcode/Label highly recommended for accuracy, but not required.")}
      </div>

      {/* Optional Section */}
      <div className="pt-6 sm:pt-8 border-t border-slate-200/60">
        {!showOptional ? (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200/60 bg-white/70 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add extra photos (optional)
          </button>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Extra photos (optional)</h3>
              <p className="text-xs sm:text-sm text-slate-600">Helps with variants and inner packaging.</p>
            </div>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {renderSlot("extra1", "Packaging details", "Side of box, shipping label, or outer packaging.", extra1GalleryInputRef, extra1CameraInputRef)}
              {renderSlot("extra2", "What's inside", "Close-up of the item, materials, or construction.", extra2GalleryInputRef, extra2CameraInputRef)}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOptional(false);
                handleFileRemove("extra1");
                handleFileRemove("extra2");
              }}
              disabled={disabled}
              className="text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors disabled:opacity-50"
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
