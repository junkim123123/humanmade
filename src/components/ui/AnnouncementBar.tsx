"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 py-2.5 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-center">
            <span className="font-semibold">March Special:</span> Free $100 Credit for Consultations in St. Louis & Toronto.{" "}
            <Link 
              href="#zoom-booking" 
              className="underline font-medium hover:text-indigo-200 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('zoom-booking')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Book Now
            </Link>
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-auto flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

