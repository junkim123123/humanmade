"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProofProduct } from "./proofData";
import { ProofProductCard } from "./ProofProductCard";
import { ProofProductModal } from "./ProofProductModal";
import { Search, SlidersHorizontal } from "lucide-react";

type SortOption = "Newest" | "Most photos";

interface ProofLibrarySectionProps {
  title: string;
  subtitle: string;
  noteText: string;
  products: ProofProduct[];
  tagOptions: string[];
  searchPlaceholder: string;
  emptyMessage: string;
  resultsLabel: string;
  photosLabel: string;
  tagLabel: string;
  outcomeLabel: string;
  checklistLabel: string;
  tagsLabel: string;
  closeLabel: string;
  loadMoreLabel: string;
}

const PAGE_SIZE = 12;

export function ProofLibrarySection({
  title,
  subtitle,
  noteText,
  products,
  tagOptions,
  searchPlaceholder,
  emptyMessage,
  resultsLabel,
  photosLabel,
  tagLabel,
  outcomeLabel,
  checklistLabel,
  tagsLabel,
  closeLabel,
  loadMoreLabel,
}: ProofLibrarySectionProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<ProofProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const productsWithIndex = useMemo(
    () => products.map((product, index) => ({ product, index })),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return productsWithIndex.filter(({ product }) => {
      const matchesQuery = normalized.length === 0 || product.name.toLowerCase().includes(normalized);
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => product.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [productsWithIndex, query, selectedTags]);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    if (sortOption === "Most photos") {
      items.sort((a, b) => b.product.photosCount - a.product.photosCount);
    } else {
      items.sort((a, b) => a.index - b.index);
    }
    return items.map((item) => item.product);
  }, [filteredProducts, sortOption]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedTags, sortOption]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]
    );
  };

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">{title}</h2>
            <p className="text-[15px] text-slate-600">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {noteText}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label
                htmlFor="proof-search"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Search
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  id="proof-search"
                  type="text"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{resultsLabel.replace("{count}", sortedProducts.length.toString())}</span>
            </div>
            <div className="min-w-[180px]">
              <label
                htmlFor="proof-sort"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Sort
              </label>
              <select
                id="proof-sort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="Newest">Newest</option>
                <option value="Most photos">Most photos</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                  selectedTags.includes(tag)
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`product-skeleton-${index}`}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
              >
                <div className="h-44 bg-slate-100 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProducts.map((product) => (
                <ProofProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                  photosLabel={photosLabel}
                  tagLabel={tagLabel}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                >
                  {loadMoreLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProofProductModal
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        closeLabel={closeLabel}
        outcomeLabel={outcomeLabel}
        checklistLabel={checklistLabel}
        tagsLabel={tagsLabel}
        photosLabel={photosLabel}
      />
    </section>
  );
}
