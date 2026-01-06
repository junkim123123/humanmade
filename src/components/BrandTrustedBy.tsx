import React from "react";

// Fallback SVG logos (if public/logos/*.png is missing)
const fallbackLogos = {
  costco: (
    <svg viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="object-contain h-full w-full">
      <rect width="96" height="32" rx="6" fill="#E6001A" />
      <text x="48" y="21" textAnchor="middle" fontWeight="bold" fontSize="18" fill="#fff">COSTCO</text>
    </svg>
  ),
  seven: (
    <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="object-contain h-full w-full">
      <rect width="64" height="32" rx="6" fill="#009A44" />
      <text x="32" y="21" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#fff">7-Eleven</text>
    </svg>
  ),
  donki: (
    <svg viewBox="0 0 96 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="object-contain h-full w-full">
      <rect width="96" height="40" rx="6" fill="#FFD600" />
      <text x="48" y="26" textAnchor="middle" fontWeight="bold" fontSize="18" fill="#0033A0">Donki</text>
    </svg>
  ),
};

function LogoImg({ src, alt, fallback }: { src: string; alt: string; fallback: React.ReactNode }) {
  const [error, setError] = React.useState(false);
  return error ? (
    fallback
  ) : (
    <img
      src={src}
      alt={alt}
      className="object-contain h-full w-full"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

export function BrandTrustedBy() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
        Sourced from factories trusted by
      </p>
      <div className="flex items-center gap-8 md:gap-12 opacity-60 grayscale transition-all duration-300 hover:grayscale-0 hover:opacity-100">
        {/* Costco Logo */}
        <div className="relative h-8 w-24">
          <LogoImg src="/logos/costco.png" alt="Costco" fallback={fallbackLogos.costco} />
        </div>
        {/* 7-Eleven Logo */}
        <div className="relative h-8 w-16">
          <LogoImg src="/logos/7-eleven.png" alt="7-Eleven" fallback={fallbackLogos.seven} />
        </div>
        {/* Don Quijote Logo */}
        <div className="relative h-10 w-24">
          <LogoImg src="/logos/donki.png" alt="Don Quijote" fallback={fallbackLogos.donki} />
        </div>
      </div>
    </div>
  );
}

export default BrandTrustedBy;
