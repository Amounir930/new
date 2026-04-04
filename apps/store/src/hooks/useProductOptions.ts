'use client';

import { useMemo, useState } from 'react';

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  options: Record<string, string>;
  inventory?: {
    available: number;
    reserved: number;
  } | null;
}

export interface OptionValue {
  value: string;
  isAvailable: boolean;
  isCompatible: boolean;
}

export interface OptionType {
  name: string;
  values: OptionValue[];
}

/**
 * 🎨 THE VARIANT ENGINE (useProductOptions)
 *
 * Rules:
 * 1. Greedy Selection: Keep track of selected options.
 * 2. Incompatibility Logic: Disable options that don't exist in any variant given current selections.
 * 3. Final Matching: Identify the single ProductVariant that matches all selections.
 */
export function useProductOptions(variants: ProductVariant[]) {
  // Null guard: prevent crashes on undefined/null variants
  if (!variants?.length) {
    return {
      options: [] as OptionType[],
      selectedOptions: {} as Record<string, string>,
      selectedVariant: null as ProductVariant | null,
      updateOption: () => { },
      isSelectionComplete: false,
    };
  }

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // 1. Get all unique option keys (e.g., ["Color", "Size"])
  const optionKeys = useMemo(() => {
    if (!variants.length) return [];
    return Object.keys(variants[0].options);
  }, [variants]);

  // 2. Build organized option types with compatibility and availability flags
  const options = useMemo(() => {
    return optionKeys.map((key): OptionType => {
      const uniqueValues = Array.from(
        new Set(variants.map((v) => v.options[key]))
      ).filter(Boolean);

      const values = uniqueValues.map((val): OptionValue => {
        // Check if this value is compatible with other currently selected options
        const otherSelections = { ...selectedOptions };
        delete otherSelections[key];

        const isCompatible = variants.some((v) => {
          const matchesValue = v.options[key] === val;
          const matchesOthers = Object.entries(otherSelections).every(
            ([k, vVal]) => v.options[k] === vVal
          );
          return matchesValue && matchesOthers;
        });

        // Check stock availability for this specific value + current selections
        const isAvailable = variants.some((v) => {
          const matchesValue = v.options[key] === val;
          const matchesOthers = Object.entries(otherSelections).every(
            ([k, vVal]) => v.options[k] === vVal
          );
          const hasStock =
            (v.inventory?.available || 0) - (v.inventory?.reserved || 0) > 0;
          return matchesValue && matchesOthers && hasStock;
        });

        return { value: val, isCompatible, isAvailable };
      });

      return { name: key, values };
    });
  }, [variants, optionKeys, selectedOptions]);

  // 3. Find the selected variant (if all options picked)
  const selectedVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length !== optionKeys.length) return null;

    return (
      variants.find((v) =>
        Object.entries(selectedOptions).every(
          ([key, val]) => v.options[key] === val
        )
      ) || null
    );
  }, [variants, optionKeys, selectedOptions]);

  const updateOption = (key: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isSelectionComplete =
    Object.keys(selectedOptions).length === optionKeys.length;

  return {
    options,
    selectedOptions,
    selectedVariant,
    updateOption,
    isSelectionComplete,
  };
}
