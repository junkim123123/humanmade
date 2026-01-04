"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { sanitizeProductName, sortProductsBySafety, type SanitizedProduct } from "@/lib/productSanitizer";

export interface ProductItem {
  folderName: string;
  displayName: string;
  slug: string;
  images: string[];
}

interface ProductGalleryProps {
  products: ProductItem[];
}

interface ProductWithSanitized extends ProductItem {
  sanitized: SanitizedProduct;
}

export function ProductGallery({ products }: ProductGalleryProps) {
  // Sanitize and sort products
  const sanitizedProducts: ProductWithSanitized[] = products.map((product) => ({
    ...product,
    sanitized: sanitizeProductName(product.displayName),
  }));

  const sortedProducts = sortProductsBySafety(sanitizedProducts);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSanitized | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (product: ProductWithSanitized) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  const closeLightbox = () => {
    setSelectedProduct(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) =>
      prev < selectedProduct.images.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : selectedProduct.images.length - 1
    );
  };

  return (
    <>
      {/* Grid - Product Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedProducts.map((product) => {
          const sanitized = product.sanitized;
          // Generate a label (mock data - in production, this could come from product data)
          const labels = [
            "Cost Reduced by 30%",
            "MOQ: 500",
            "Lead Time: 4 weeks",
            "Verified Supplier",
          ];
          const label = labels[Math.floor(Math.random() * labels.length)];

          return (
            <div
              key={product.slug}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              {/* Image */}
              <button
                type="button"
                onClick={() => openLightbox(product)}
                className="relative aspect-square w-full overflow-hidden bg-slate-100"
              >
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={sanitized.sanitizedName}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
              </button>

              {/* Card Content */}
              <div className="p-4">
                {/* Product Name */}
                <h3 className="text-[14px] font-semibold text-slate-900 mb-2 line-clamp-2">
                  {sanitized.sanitizedName}
                </h3>

                {/* Label */}
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {label}
                  </span>
                </div>

                {/* License Required Badge */}
                {sanitized.requiresLicense && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      License Required
                    </span>
                  </div>
                )}

                {/* Photo count */}
                {product.images.length > 1 && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    {product.images.length} photos
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-lg border border-amber-200 bg-amber-50">
        <p className="text-[13px] text-amber-800 leading-relaxed">
          <strong>Note:</strong> Branded or character merchandise requires valid IP authorization documents for import. We strictly adhere to US Customs regulations.
        </p>
      </div>

      {/* Lightbox */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900 sm:aspect-[4/3]">
              <Image
                src={selectedProduct.images[currentImageIndex]}
                alt={`${selectedProduct.displayName} - Image ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain"
                priority
              />

              {/* Navigation arrows */}
              {selectedProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Caption */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-white">
                {sanitizeProductName(selectedProduct.displayName).sanitizedName}
              </h3>
              {selectedProduct.images.length > 1 && (
                <p className="mt-1 text-sm text-white/60">
                  {currentImageIndex + 1} / {selectedProduct.images.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
