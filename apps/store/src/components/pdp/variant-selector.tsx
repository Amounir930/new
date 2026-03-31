'use client';

interface VariantOption {
  id: string;
  name: string;
  price?: string;
  compareAtPrice?: string;
  available: boolean;
  stock?: number;
}

interface VariantSelectorProps {
  variantType: 'color' | 'size' | 'material' | string;
  options: VariantOption[];
  selectedOption?: string | null;
  onOptionSelect: (variantId: string) => void;
  className?: string;
}

/**
 * ── VARIANT SELECTOR ──
 *
 * Features:
 * 1. Stock-aware disabling (gray out unavailable variants)
 * 2. Visual feedback for selection
 * 3. Support for color swatches and text options
 * 4. Accessible (keyboard navigation, ARIA)
 */
export function VariantSelector({
  variantType,
  options,
  selectedOption,
  onOptionSelect,
  className = '',
}: VariantSelectorProps) {
  const isColorType = variantType.toLowerCase() === 'color';

  const handleSelect = (option: VariantOption) => {
    if (!option.available) return;
    onOptionSelect(option.id);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
        {variantType}
      </h3>
      <div
        className={`flex flex-wrap gap-3 ${isColorType ? 'items-center' : ''}`}
        role="radiogroup"
        aria-label={`Select ${variantType}`}
      >
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isDisabled = !option.available;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
              onClick={() => handleSelect(option)}
              disabled={isDisabled}
              className={`
                relative px-5 py-2.5 text-sm font-bold rounded-xl
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                ${
                  isSelected
                    ? 'border-2 border-black bg-black text-white'
                    : 'border-2 border-gray-100 text-gray-900 hover:border-gray-300'
                }
                ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'active:scale-95 cursor-pointer'
                }
                ${isColorType ? 'w-12 h-12 rounded-full p-0' : ''}
              `}
            >
              {isColorType ? (
                <span
                  className="block w-full h-full rounded-full border border-gray-200"
                  style={{ backgroundColor: option.name }}
                />
              ) : (
                <span className="flex items-center gap-2">
                  {option.name}
                  {option.price && option.price !== '0' && (
                    <span className="text-xs text-gray-500">
                      (+${option.price})
                    </span>
                  )}
                </span>
              )}

              {/* Out of stock indicator */}
              {isDisabled && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400 opacity-50"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text for out of stock */}
      {options.some((o) => !o.available) && (
        <p className="text-xs text-gray-500">
          <span className="font-semibold">Note:</span> Grayed out options are
          currently unavailable
        </p>
      )}
    </div>
  );
}

/**
 * ── VARIANT OPTION PARSER ──
 * Converts product variant data into selector options
 */
export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  options: Record<string, string>; // e.g., { color: 'Red', size: 'M' }
  inventory?: {
    available: number;
    reserved: number;
  } | null;
}

export function parseVariantOptions(
  variants: ProductVariant[],
  variantType: string
): VariantOption[] {
  // Extract unique values for the specified variant type
  const optionMap = new Map<
    string,
    {
      id: string;
      name: string;
      price: string;
      available: boolean;
      stock?: number;
    }
  >();

  for (const variant of variants) {
    const optionValue = variant.options[variantType];
    if (!optionValue) continue;

    const available =
      (variant.inventory?.available || 0) - (variant.inventory?.reserved || 0) >
      0;
    const stock = variant.inventory?.available || 0;

    // If this option already exists, check if any variant with this option is available
    const existing = optionMap.get(optionValue);
    if (existing) {
      if (available) {
        existing.available = true;
        existing.stock = (existing.stock || 0) + (stock || 0);
      }
    } else {
      optionMap.set(optionValue, {
        id: variant.id,
        name: optionValue,
        price: variant.price,
        available,
        stock,
      });
    }
  }

  return Array.from(optionMap.values());
}
