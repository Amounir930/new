'use client';

import { useState } from 'react';

const SHIPPING_OPTIONS: Array<{
  method: 'standard' | 'express' | 'overnight';
  label: string;
  price: string;
  delivery: string;
}> = [
  { method: 'standard', label: 'Standard Shipping', price: 'Free', delivery: '5-7 business days' },
  { method: 'express', label: 'Express Shipping', price: 'SAR 50.00', delivery: '2-3 business days' },
  { method: 'overnight', label: 'Overnight Shipping', price: 'SAR 150.00', delivery: 'Next business day' },
];

export function ShippingStep({
  onComplete,
  onBack,
}: {
  onComplete: (method: 'standard' | 'express' | 'overnight') => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<'standard' | 'express' | 'overnight'>('standard');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Shipping Method</h2>

      <div className="space-y-3">
        {SHIPPING_OPTIONS.map((option) => (
          <label
            key={option.method}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              selected === option.method
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                value={option.method}
                checked={selected === option.method}
                onChange={() => setSelected(option.method)}
                className="h-4 w-4 text-black focus:ring-black"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.delivery}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900">{option.price}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onComplete(selected)}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
