"use client";

import { DollarSign, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import type { Report } from "@/lib/report/types";

interface ProfitCheckCardProps {
  report: Report;
}

const QUANTITY_PRESETS = [100, 300, 1000];

export default function ProfitCheckCard({ report }: ProfitCheckCardProps) {
  // Dual state for retail price: input (string for user typing) and committed (number for calculations)
  const [shelfPriceInput, setShelfPriceInput] = useState<string>("");
  const [shelfPriceCommitted, setShelfPriceCommitted] = useState<number | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(QUANTITY_PRESETS[0]);
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reportAny = report as any;
  const inputStatus = reportAny.inputStatus || {};
  const existingPrice = inputStatus.shelfPrice || reportAny.targetSellPrice;

  const costRange = report.baseline?.costRange;
  const standardCost = costRange?.standard?.totalLandedCost || 0;

  // Use committed value if set, otherwise use existing price from report
  const targetSellPrice = shelfPriceCommitted || existingPrice;

  /**
   * Commit the retail price from input
   * - Validates: not empty, valid number, not negative
   * - Updates shelfPriceCommitted and clears error
   * - Preserves input for user flexibility
   */
  const commitShelfPrice = () => {
    setInputError(null);

    // Empty input is allowed - clears the retail price
    if (shelfPriceInput.trim() === "") {
      setShelfPriceCommitted(null);
      return;
    }

    // Try to parse the input
    // Support: "15", "15.99", "$15.99", "15,99"
    let cleanedInput = shelfPriceInput.trim();

    // Remove dollar sign if present
    cleanedInput = cleanedInput.replace(/^\$/, "");

    // Handle comma as decimal separator (for intl users)
    const hasComma = cleanedInput.includes(",");
    const hasDot = cleanedInput.includes(".");
    if (hasComma && !hasDot) {
      cleanedInput = cleanedInput.replace(",", ".");
    }

    const parsed = parseFloat(cleanedInput);

    if (isNaN(parsed)) {
      setInputError("Please enter a valid price");
      return;
    }

    if (parsed < 0) {
      setInputError("Price cannot be negative");
      return;
    }

    if (parsed === 0) {
      setInputError("Price must be greater than zero");
      return;
    }

    // Valid! Commit it
    setShelfPriceCommitted(parsed);
    // Keep input as-is for user to see what they typed
  };

  /**
   * Handle input change - only updates the string, no validation/formatting
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShelfPriceInput(e.target.value);
    // Clear error when user starts typing again
    setInputError(null);
  };

  /**
   * Handle blur - commit on blur
   */
  const handleInputBlur = () => {
    commitShelfPrice();
  };

  /**
   * Handle Enter key - commit on Enter
   */
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitShelfPrice();
      inputRef.current?.blur();
    }
  };

  /**
  * Clear the retail price and reset input
   */
  const handleClear = () => {
    setShelfPriceInput("");
    setShelfPriceCommitted(null);
    setInputError(null);
    inputRef.current?.focus();
  };

  const handleQuantityPreset = (qty: number) => {
    setSelectedQuantity(qty);
    setCustomQuantity("");
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedQuantity(parsed);
    }
  };

  // If no committed price, show input form
  if (!targetSellPrice) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-slate-900">Profit check</h3>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">
              Retail price (USD)
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 14.99"
              value={shelfPriceInput}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                inputError
                  ? "border-red-300 focus:ring-red-500 bg-red-50"
                  : "border-slate-200 focus:ring-blue-500"
              }`}
            />
          </label>

          {inputError && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{inputError}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            💡 Type your retail price. Calculations will update when you blur or press Enter.
          </p>
        </div>
      </div>
    );
  }

  // Committed price exists - show results
  const profit = targetSellPrice - standardCost;
  const margin = ((profit / targetSellPrice) * 100).toFixed(1);
  const profitPerCase = profit * (inputStatus.unitsPerCase || 1);
  const totalProfit = profit * selectedQuantity;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-slate-900">Profit check</h3>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Change
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">Quantity</p>
          <div className="flex flex-wrap gap-2">
            {QUANTITY_PRESETS.map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => handleQuantityPreset(qty)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  selectedQuantity === qty
                    ? "border-electric-blue-500 bg-electric-blue-50 text-electric-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {qty} units
              </button>
            ))}
            <input
              type="number"
              min={1}
              placeholder="Custom"
              value={customQuantity}
              onChange={(e) => handleCustomQuantityChange(e.target.value)}
              className="w-24 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Gross margin</p>
          <p className="text-2xl font-bold text-green-600">{margin}%</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Per unit</p>
            <p className="text-lg font-semibold text-slate-900">
              ${profit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Per case</p>
            <p className="text-lg font-semibold text-slate-900">
              ${profitPerCase.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Total profit ({selectedQuantity.toLocaleString()} units)</p>
          <p className={`text-lg font-semibold ${totalProfit >= 0 ? "text-slate-900" : "text-red-600"}`}>
            ${totalProfit.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

