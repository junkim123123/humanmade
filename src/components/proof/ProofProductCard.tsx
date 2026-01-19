import type { ProofProduct } from "./proofData";

interface ProofProductCardProps {
  product: ProofProduct;
  onClick: () => void;
  photosLabel: string;
}

export function ProofProductCard({
  product,
  onClick,
  photosLabel,
}: ProofProductCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-[4/3] bg-slate-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
          {product.photosCount} {photosLabel}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
          {product.category && (
            <p className="text-xs text-slate-500">{product.category}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
