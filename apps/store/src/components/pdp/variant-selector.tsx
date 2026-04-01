'use client';

import { useMemo } from 'react';

export interface OptionValue {
  value: string;
  isAvailable: boolean;
  isCompatible: boolean;
}

export interface OptionType {
  name: string;
  values: OptionValue[];
}

interface VariantSelectorProps {
  options: OptionType[];
  selectedOptions: Record<string, string>;
  onOptionSelect: (key: string, value: string) => void;
  className?: string;
}

/**
 * ── VARIANT SELECTOR (SWATCHES & PILLS) ──
 * 
 * Features:
 * 1. Automatic Swatch/Pill Detection: If option name is 'Color', use swatches.
 * 2. Visual Strikethrough for out-of-stock items.
 * 3. Accessibility: ARIA roles and labels.
 */
export function VariantSelector({
  options,
  selectedOptions,
  onOptionSelect,
  className = '',
}: VariantSelectorProps) {
  if (!options.length) return null;

  return (
    <div className={`space-y-8 ${className}`}>
      {options.map((optionType) => (
        <OptionGroup
          key={optionType.name}
          optionType={optionType}
          selectedOption={selectedOptions[optionType.name]}
          onSelect={(val) => onOptionSelect(optionType.name, val)}
        />
      ))}
    </div>
  );
}

interface OptionGroupProps {
  optionType: OptionType;
  selectedOption: string | undefined;
  onSelect: (val: string) => void;
}

function OptionGroup({ optionType, selectedOption, onSelect }: OptionGroupProps) {
  const isColor = optionType.name.toLowerCase() === 'color';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">
          {optionType.name}
        </h3>
        {selectedOption && (
          <span className="text-xs font-bold text-blue-600">
            Selected: {selectedOption}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={`Select ${optionType.name}`}>
        {optionType.values.map((opt) => {
          const isSelected = selectedOption === opt.value;
          const isDisabled = !opt.isCompatible;
          const isOutOfStock = !opt.isAvailable && opt.isCompatible;

          if (isColor) {
            return (
              <Swatch
                key={opt.value}
                color={opt.value}
                isSelected={isSelected}
                isDisabled={isDisabled}
                isOutOfStock={isOutOfStock}
                onClick={() => onSelect(opt.value)}
              />
            );
          }

          return (
            <Pill
              key={opt.value}
              label={opt.value}
              isSelected={isSelected}
              isDisabled={isDisabled}
              isOutOfStock={isOutOfStock}
              onClick={() => onSelect(opt.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Swatch({
  color,
  isSelected,
  isDisabled,
  isOutOfStock,
  onClick,
}: {
  color: string;
  isSelected: boolean;
  isDisabled: boolean;
  isOutOfStock: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Select color ${color}`}
      className={`
        relative w-12 h-12 rounded-full p-1.5 transition-all duration-300
        ${isDisabled ? 'opacity-20 cursor-not-allowed scale-90' : 'hover:scale-110 active:scale-95'}
        ${isSelected ? 'ring-2 ring-black ring-offset-2' : 'ring-1 ring-gray-100'}
      `}
    >
      <span
        className="block w-full h-full rounded-full border border-black/5 shadow-inner"
        style={{ backgroundColor: color }}
      />
      {isOutOfStock && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1px] h-full bg-red-400 rotate-45 opacity-60" />
        </span>
      )}
      {isSelected && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
          ✓
        </span>
      )}
    </button>
  );
}

function Pill({
  label,
  isSelected,
  isDisabled,
  isOutOfStock,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  isDisabled: boolean;
  isOutOfStock: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative min-w-[3.5rem] px-6 py-3 text-sm font-black rounded-2xl
        transition-all duration-300 border-2
        ${isDisabled ? 'opacity-20 bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400 grayscale' : ''}
        ${!isDisabled && isOutOfStock ? 'border-gray-100 text-gray-400 bg-gray-50/50' : ''}
        ${!isDisabled && !isSelected && !isOutOfStock ? 'border-gray-100 text-gray-900 hover:border-black active:bg-gray-50' : ''}
        ${isSelected ? 'border-black bg-black text-white shadow-xl -translate-y-0.5' : ''}
      `}
    >
      <span className={isOutOfStock ? 'line-through decoration-red-400/50' : ''}>
        {label}
      </span>
      {isOutOfStock && (
        <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-red-50 text-[10px] text-red-600 font-bold uppercase tracking-tighter">
          Out
        </span>
      )}
    </button>
  );
}
