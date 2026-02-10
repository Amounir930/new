/**
 * AddToCartButton Component
 *
 * Smart button for adding products to cart with quantity selector.
 *
 * @module components/product/AddToCartButton
 */

'use client';

import { useState } from 'react';

// Inline Product type (avoiding workspace dependency)
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

export interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      // TODO: Implement actual cart logic
      // await endpoints.cart.addItem({
      //   productId: product.id,
      //   quantity,
      // });

      // Show success toast
      alert(`Added ${quantity}x ${product.name} to cart!`);
    } catch (_error) {
      console.error('Failed to add to cart');
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Quantity:</label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100"
            disabled={isAdding}
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-16 text-center border-x border-gray-300 py-2"
            min="1"
            disabled={isAdding}
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-gray-100"
            disabled={isAdding}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!product.inStock || isAdding}
        className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isAdding
          ? 'Adding...'
          : product.inStock
            ? 'Add to Cart'
            : 'Out of Stock'}
      </button>

      {/* Buy Now Button (Optional) */}
      {product.inStock && (
        <button
          className="w-full border-2 border-primary text-primary py-3 px-6 rounded-md font-medium hover:bg-primary-50 transition-colors"
          disabled={isAdding}
        >
          Buy Now
        </button>
      )}
    </div>
  );
}
