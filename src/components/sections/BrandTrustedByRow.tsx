import React from "react";

export function BrandTrustedByRow() {
  return (
    <div className="flex justify-center items-center gap-8 md:gap-12 mb-8">
      <div className="relative h-8 w-24">
        <img src="/logos/costco.svg" alt="Costco" className="object-contain h-full w-full" loading="lazy" />
      </div>
      <div className="relative h-8 w-16">
        <img src="/logos/7-eleven.svg" alt="7-Eleven" className="object-contain h-full w-full" loading="lazy" />
      </div>
      <div className="relative h-10 w-24">
        <img src="/logos/donki.svg" alt="Don Quijote" className="object-contain h-full w-full" loading="lazy" />
      </div>
    </div>
  );
}
export default BrandTrustedByRow;
