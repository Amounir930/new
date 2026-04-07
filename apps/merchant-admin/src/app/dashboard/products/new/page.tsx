'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductForm } from '@/components/products/product-form';
import { apiFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();

  /**
   * Called by ProductForm.onSubmit when the merchant clicks Save.
   * At this point, the draft was already created in the DB (product-form handles the POST /draft).
   * We use PUT /:id to promote the draft → live product (sets is_active=true).
   *
   * data.id = the draft product_id returned from POST /draft and stored in the form state.
   */
  const handleCreateProduct = async (
    data: { id?: string } & Record<string, unknown>
  ) => {
    if (!data.id) {
      toast.error('Product session lost. Please refresh and try again.');
      return;
    }
    const toastId = toast.loading('Saving product...');
    try {
      const { id, ...payload } = data;
      await apiFetch(`/merchant/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      toast.success('Product created successfully', { id: toastId });
      router.push('/dashboard/products');
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create product';
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <ProductForm onSubmit={handleCreateProduct} />
    </div>
  );
}
