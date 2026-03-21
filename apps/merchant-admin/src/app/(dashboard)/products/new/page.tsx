'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/product-form';
import { apiFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();

  const handleCreateProduct = async (data: unknown) => {
    try {
      await apiFetch('/merchant/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // toast.success('Product created successfully');
      router.push('/dashboard/products');
      router.refresh();
    } catch (_error: unknown) {
      /* 'Failed to create product:', error */
      // toast.error(error.message || 'Failed to create product');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <ProductForm onSubmit={handleCreateProduct} />
    </div>
  );
}
