/**
 * CartItem Component
 *
 * Displays a single cart item with quantity controls and remove button.
 *
 * @module components/cart/CartItem
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/formatters';

export interface CartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      slug: string;
      name: string;
      price: number;
      currency: string;
      images: Array<{ url: string; alt: string }>;
    };
    quantity: number;
    variant?: {
      id: string;
      name: string;
      attributes: Record<string, string>;
    };
  };
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemove?: (itemId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const primaryImage = item.product.images[0];
  const itemTotal = item.product.price * item.quantity;

  return (
    <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
      {/* Product Image */}
      <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
        <div className="relative w-24 h-24 rounded-md overflow-hidden">
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || item.product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1">
        <Link href={`/products/${item.product.slug}`}>
          <h3 className="font-medium hover:text-primary transition-colors">
            {item.product.name}
          </h3>
        </Link>

        {item.variant && (
          <p className="text-sm text-gray-600 mt-1">
            {Object.entries(item.variant.attributes)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')}
          </p>
        )}

        <p className="text-gray-900 font-medium mt-2">
          {formatPrice(item.product.price, item.product.currency)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end justify-between">
        <button
          type="button"
          onClick={() => onRemove?.(item.id)}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Remove
        </button>

        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            onClick={() =>
              onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))
            }
            className="px-2 py-1 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-3 py-1 min-w-[3rem] text-center">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
            className="px-2 py-1 hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <p className="font-bold text-lg">
          {formatPrice(itemTotal, item.product.currency)}
        </p>
      </div>
    </div>
  );
}
