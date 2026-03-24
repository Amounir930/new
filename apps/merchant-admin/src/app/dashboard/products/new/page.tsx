'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductForm } from '@/components/products/product-form';
import { apiFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();

  const handleCreateProduct = async (data: any) => {
    const toastId = toast.loading('Creating product...');
    try {
      await apiFetch('/merchant/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast.success('Product created successfully', { id: toastId });
      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product', { id: toastId });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <ProductForm onSubmit={handleCreateProduct} />
    </div>
  );
}
