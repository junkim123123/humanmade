import React from "react";

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center bg-slate-900 rounded-lg p-1.5 ${className}`}>
      {/* Geometric Tiger Head SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >
        <path
          d="M12 4L15 2L18 5L17 8L19 10L18 13L15 15L12 14L9 15L6 13L5 10L7 8L6 5L9 2L12 4Z"
          fill="currentColor"
        />
        <path
          d="M10 9L11 8M14 9L13 8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M11 12H13"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
