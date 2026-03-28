'use client';

import { Loader2, Lock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductForm } from '@/components/products/product-form';
import { apiFetch } from '@/lib/api';
import type { CreateProductInput } from '@apex/validation';
import { PRODUCT_NICHES } from '@apex/validation';

type Niche = (typeof PRODUCT_NICHES)[number];

// ─── Raw DB Product shape ────────────────────────────────────────────────────
interface RawProduct {
  id: string;
  name: { ar: string; en: string };
  shortDescription?: { ar?: string | null; en?: string | null } | null;
  longDescription?: { ar?: string | null; en?: string | null } | null;
  sku: string;
  slug: string;
  niche: Niche;
  barcode?: string | null;
  basePrice: string;
  salePrice?: string | null;
  costPrice?: string | null;
  compareAtPrice?: string | null;
  taxBasisPoints?: number | null;
  weight?: number | null;
  dimensions?: { h?: number; w?: number; l?: number } | null;
  minOrderQty?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  requiresShipping?: boolean;
  isDigital?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isReturnable?: boolean;
  mainImage?: string;
  galleryImages?: { url: string; altText?: string; order: number }[];
  videoUrl?: string | null;
  digitalFileUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  attributes?: Record<string, unknown> | null;
  specifications?: Record<string, string> | null;
  tags?: string[] | null;
  warrantyPeriod?: number | null;
  warrantyUnit?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  countryOfOrigin?: string | null;
  version: number;
}

// ─── Hydration Mapper ─────────────────────────────────────────────────────────
// Transforms the raw DB/API response shape → flat ProductForm defaultValues.
// This is the critical bridge that prevents the rendering crash.
function hydrateProductForForm(raw: RawProduct): CreateProductInput & { id: string; version: number } {
  const common = {
    // Identity
    id: raw.id,
    version: raw.version,

    // Flat name fields
    nameAr: raw.name?.ar ?? '',
    nameEn: raw.name?.en ?? '',

    // Flat description fields
    shortDescriptionAr: raw.shortDescription?.ar ?? undefined,
    shortDescriptionEn: raw.shortDescription?.en ?? undefined,
    descriptionAr: raw.longDescription?.ar ?? undefined,
    descriptionEn: raw.longDescription?.en ?? undefined,

    // Identifiers
    sku: raw.sku,
    slug: raw.slug,
    barcode: raw.barcode ?? undefined,
    brandId: raw.brandId ?? undefined,
    categoryId: raw.categoryId ?? undefined,
    countryOfOrigin: raw.countryOfOrigin ?? undefined,

    // Pricing
    basePrice: parseFloat(raw.basePrice ?? '0'),
    salePrice: raw.salePrice ? parseFloat(raw.salePrice) : undefined,
    costPrice: raw.costPrice ? parseFloat(raw.costPrice) : undefined,
    compareAtPrice: raw.compareAtPrice ? parseFloat(raw.compareAtPrice) : undefined,
    taxPercentage: raw.taxBasisPoints ? raw.taxBasisPoints / 100 : 0,

    // Logistics
    weight: raw.weight ?? undefined,
    minOrderQty: raw.minOrderQty ?? 1,
    lowStockThreshold: raw.lowStockThreshold ?? 5,
    trackInventory: raw.trackInventory ?? true,
    requiresShipping: raw.requiresShipping ?? true,
    isDigital: raw.isDigital ?? false,

    // Flat dimensions
    dimHeight: raw.dimensions?.h ?? 0,
    dimWidth: raw.dimensions?.w ?? 0,
    dimLength: raw.dimensions?.l ?? 0,

    // Status flags
    isActive: raw.isActive ?? true,
    isFeatured: raw.isFeatured ?? false,
    isReturnable: raw.isReturnable ?? true,

    // JSONB fields
    specifications: raw.specifications ?? {},
    tags: raw.tags ?? [],
    galleryImages: raw.galleryImages ?? [],

    // Media
    mainImage: raw.mainImage ?? '',
    videoUrl: raw.videoUrl ?? undefined,
    digitalFileUrl: raw.digitalFileUrl ?? undefined,

    // SEO
    metaTitle: raw.metaTitle ?? undefined,
    metaDescription: raw.metaDescription ?? undefined,
    keywords: raw.keywords ?? undefined,

    // Warranty
    warrantyPeriod: raw.warrantyPeriod ?? undefined,
    warrantyUnit: (raw.warrantyUnit ?? undefined) as CreateProductInput['warrantyUnit'],
  };

  const rawAttr = raw.attributes ?? {};

  // STRICT UNION SATISFACTION WITH SPECIFIC ASSERTIONS (NO 'any')
  switch (raw.niche) {
    case 'retail':      return { ...common, niche: 'retail',      attributes: rawAttr as Extract<CreateProductInput, { niche: 'retail' }>['attributes'] };
    case 'wellness':    return { ...common, niche: 'wellness',    attributes: rawAttr as Extract<CreateProductInput, { niche: 'wellness' }>['attributes'] };
    case 'education':   return { ...common, niche: 'education',   attributes: rawAttr as Extract<CreateProductInput, { niche: 'education' }>['attributes'] };
    case 'services':    return { ...common, niche: 'services',    attributes: rawAttr as Extract<CreateProductInput, { niche: 'services' }>['attributes'] };
    case 'hospitality': return { ...common, niche: 'hospitality', attributes: rawAttr as Extract<CreateProductInput, { niche: 'hospitality' }>['attributes'] };
    case 'real_estate': return { ...common, niche: 'real_estate', attributes: rawAttr as Extract<CreateProductInput, { niche: 'real_estate' }>['attributes'] };
    case 'creative':    return { ...common, niche: 'creative',    attributes: rawAttr as Extract<CreateProductInput, { niche: 'creative' }>['attributes'] };
    case 'food':        return { ...common, niche: 'food',        attributes: rawAttr as Extract<CreateProductInput, { niche: 'food' }>['attributes'] };
    case 'digital':     return { ...common, niche: 'digital',     attributes: rawAttr as Extract<CreateProductInput, { niche: 'digital' }>['attributes'] };
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<ReturnType<typeof hydrateProductForForm> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    apiFetch<RawProduct>(`/merchant/products/${id}`)
      .then((raw) => {
        setInitialData(hydrateProductForForm(raw));
      })
      .catch((err) => {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load product. Please refresh.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateProduct = async (data: CreateProductInput & { draftProductId?: string }) => {
    // draftProductId is the form's internal tracking field — not sent to API
    // version comes from the hydrated initialData
    const { draftProductId: _ignored, ...payload } = data;

    try {
      await apiFetch(`/merchant/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...payload,
          version: initialData?.version,
        }),
      });
      toast.success('Product updated successfully!');
      router.push('/dashboard/products');
      router.refresh();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Failed to update product';
      toast.error(message);
      // Re-throw so ProductForm can reset its loading state
      throw err;
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading product…</p>
        </div>
      </div>
    );
  }

  // ── Not Found ──────────────────────────────────────────────────────────────
  if (notFound || !initialData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 opacity-20" />
        <p className="text-xl font-bold">Product not found</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-primary hover:underline text-sm"
        >
          ← Go back
        </button>
      </div>
    );
  }

  // ── Edit Form ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-4">
      {/* Edit mode banner */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
        <Lock className="h-4 w-4 shrink-0" />
        <span>
          <strong>Edit Mode</strong> — SKU and Slug are read-only to preserve order references and SEO paths.
        </span>
      </div>

      <ProductForm
        initialData={initialData as Partial<CreateProductInput>}
        onSubmit={handleUpdateProduct}
        isEditMode
      />
    </div>
  );
}

// ── Missing import added inline ────────────────────────────────────────────
import { Package } from 'lucide-react';
