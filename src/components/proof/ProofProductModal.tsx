"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ProofProduct } from "./proofData";

interface ProofProductModalProps {
  isOpen: boolean;
  product: ProofProduct | null;
  onClose: () => void;
  closeLabel: string;
  outcomeLabel: string;
  checklistLabel: string;
  tagsLabel: string;
  photosLabel: string;
}

export function ProofProductModal({
  isOpen,
  product,
  onClose,
  closeLabel,
  outcomeLabel,
  checklistLabel,
  tagsLabel,
  photosLabel,
}: ProofProductModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const photos = useMemo(() => {
    if (!product) return [];
    const count = Math.min(Math.max(product.photosCount, 1), 6);
    return Array.from({ length: count }).map(() => product.imageUrl);
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const outcomeText = product.highlights[0] || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">{product.name}</p>
            {product.category && (
              <p className="text-xs text-slate-500">{product.category}</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 px-6 py-6">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="aspect-[4/3]">
                {photos[activeIndex] && (
                  <img
                    src={photos[activeIndex]}
                    alt={`${product.name} preview`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-600">
                  {photos.map((_, idx) => (
                    <button
                      key={`photo-dot-${idx}`}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`h-2 w-2 rounded-full ${idx === activeIndex ? "bg-slate-900" : "bg-slate-300"}`}
                      aria-label={`${photosLabel} ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                {outcomeLabel}
              </p>
              <p className="text-sm text-slate-700">{outcomeText}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                {tagsLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                {checklistLabel}
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {product.highlights.slice(0, 8).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
