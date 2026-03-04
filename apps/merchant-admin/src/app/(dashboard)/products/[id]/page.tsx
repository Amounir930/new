'use client';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '@/components/products/product-form';
import { apiFetch } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await apiFetch<unknown>(`/products/${id}`);
        setProduct(data);
      } catch (_error) {
        /* 'Failed to fetch product:', error */
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  const handleUpdateProduct = async (data: unknown) => {
    try {
      await apiFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      router.push('/dashboard/products');
      router.refresh();
    } catch (_error) {
      /* 'Failed to update product:', error */
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold">Product not found</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <ProductForm initialData={product} onSubmit={handleUpdateProduct} />
    </div>
  );
}
