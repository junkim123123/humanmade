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
    tooltipText?: string,
    isCompact = false
  ) => {
    const slot = slots[slotType];
    const hasImage = !!slot.file;
    const validationError = slot.error;
    const submissionError = isRequired ? validationErrors?.[slotType as "product" | "barcode" | "label"] : undefined;
    const hasAnyError = validationError || submissionError;

    return (
      <div ref={slotRef} className={cn("flex flex-col", isCompact ? "h-full" : "")}>
        {/* Header - Only show if not compact */}
        {!isCompact && (
          <div className={cn("mb-4", isCompact ? "mb-2" : "sm:mb-5")}>
            <div className="flex items-center gap-2.5 mb-3">
              <h4 className={cn("font-bold text-slate-900", isCompact ? "text-sm" : "text-base sm:text-lg")}>{label}</h4>
              {isRequired && (
                <span className="rounded-full bg-rose-50 border border-rose-200/60 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  Required
                </span>
              )}
              {!isRequired && (
                <span className="rounded-full bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Optional
                </span>
              )}
            </div>
            {helperText && !isCompact && (
              <p className={cn("text-slate-600 leading-relaxed", isCompact ? "text-xs" : "text-sm sm:text-base")}>{helperText}</p>
            )}
            {tooltipText && !isCompact && (
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{tooltipText}</p>
            )}
          </div>
        )}
        
        {/* Compact header for compact mode */}
        {isCompact && label && (
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
            {isRequired && (
              <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            )}
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            "relative rounded-2xl border transition-all overflow-hidden group flex items-center justify-center",
            isCompact ? "flex-1" : "flex-1",
            hasImage
              ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white shadow-lg shadow-emerald-100/30"
              : hasAnyError
              ? "border-red-200/80 bg-gradient-to-br from-red-50/50 to-white shadow-lg shadow-red-100/30"
              : "border-slate-200/80 bg-white shadow-sm hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/50 cursor-pointer transition-shadow"
          )}
          onDrop={(e) => handleDrop(slotType, e)}
          onDragOver={(e) => e.preventDefault()}
          onPaste={(e) => handlePaste(slotType, e)}
        >
          {hasImage && slot.preview ? (
            <div className={cn("relative w-full h-full bg-gradient-to-br from-slate-50 to-white", isCompact ? "min-h-[160px]" : "min-h-[280px] sm:min-h-[320px]")}>
              <img src={slot.preview} alt={label} className={cn("h-full w-full object-contain", isCompact ? "p-4" : "p-6")} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
              <div className={cn("absolute flex gap-2", isCompact ? "right-2 top-2" : "right-4 top-4")}>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={disabled}
                  className={cn("rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg font-semibold text-slate-700 hover:bg-white hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50", isCompact ? "px-2 py-1 text-xs" : "px-3.5 py-2 text-xs")}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => handleFileRemove(slotType)}
                  disabled={disabled}
                  className={cn("rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all disabled:opacity-50", isCompact ? "p-1.5" : "p-2")}
                >
                  <X className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                </button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              isCompact ? "min-h-[160px] border-slate-200 hover:border-slate-300 hover:bg-slate-50/50" : "min-h-[280px] sm:min-h-[320px] border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            )}
            onClick={() => galleryInputRef.current?.click()}
            >
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-slate-100 rounded-2xl blur-xl opacity-50" />
                <div className={cn("relative rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 shadow-sm", isCompact ? "p-3" : "p-4 sm:p-5")}>
                  <ImageIcon className={cn("text-slate-400", isCompact ? "h-6 w-6" : "h-7 w-7 sm:h-9 sm:w-9")} />
                </div>
              </div>
              
              {/* Buttons - Only show for main upload */}
              {!isCompact && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        galleryInputRef.current?.click();
                      }}
                      disabled={disabled}
                      className="flex-1 rounded-lg bg-white border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-50 touch-manipulation"
                    >
                      Choose photos
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      disabled={disabled}
                      className="flex-1 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 touch-manipulation sm:hidden"
                    >
                      Take photo
                    </button>
                  </div>
                  
                  {/* Helper text */}
                  <p className="text-xs text-slate-500 font-medium">Or drop, paste files here</p>
                </>
              )}
              
              {/* Compact mode text */}
              {isCompact && (
                <p className="text-xs text-slate-500 text-center px-4">Click or drop to upload</p>
              )}
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
          <div className="mt-3 sm:mt-4 p-3.5 rounded-xl bg-gradient-to-br from-rose-50/90 to-white border border-rose-200/60 shadow-sm">
            <p className="text-xs sm:text-sm text-rose-700 font-semibold leading-relaxed">
              {validationError || submissionError}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Upload Section - 60:40 Layout */}
      <div className="grid gap-6 lg:grid-cols-[60fr_40fr]">
        {/* Main Dropzone (60%) */}
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Product Photo</h3>
            <p className="text-xs text-slate-500">Required • Drag & drop your product image here</p>
          </div>
          {renderSlot("product", "Product photo", "Clear front photo of the product or package. Make the name readable.", productGalleryInputRef, productCameraInputRef, productSlotRef, true, "", false)}
        </div>
        
        {/* Sub Dropzone (40%) - Stacked */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Optional</h3>
          </div>
          <div className="space-y-4">
            {renderSlot("barcode", "Barcode", "UPC or EAN close-up", barcodeGalleryInputRef, barcodeCameraInputRef, barcodeSlotRef, false, "", true)}
            {renderSlot("label", "Label", "Back label with details", labelGalleryInputRef, labelCameraInputRef, labelSlotRef, false, "", true)}
          </div>
        </div>
      </div>

      {/* Optional Section */}
      <div className="pt-8 sm:pt-10 border-t border-slate-200/80">
        {!showOptional ? (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            disabled={disabled}
            className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add extra photos (optional)
          </button>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Extra photos (optional)</h3>
              <p className="text-sm sm:text-base text-slate-600">Helps with variants and inner packaging.</p>
            </div>
            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
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
              className="text-sm text-slate-500 hover:text-rose-600 font-semibold transition-colors disabled:opacity-50"
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
