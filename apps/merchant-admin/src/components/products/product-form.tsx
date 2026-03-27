'use client';

import { type CreateProductInput, CreateProductSchema } from '@apex/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Loader2,
  Package,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';

// ─── Tab Definitions ──────────────────────────────────────────
const TABS = [
  { id: 'general',   label: 'General',   icon: Package },
  { id: 'pricing',   label: 'Pricing',   icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Truck },
  { id: 'details',   label: 'Details',   icon: FileText },
  { id: 'media',     label: 'Media',     icon: ImageIcon },
  { id: 'seo',       label: 'SEO',       icon: Search },
  { id: 'advanced',  label: 'Advanced',  icon: Settings2 },
] as const;

type TabId = typeof TABS[number]['id'];

const TAB_FIELD_MAP: Record<string, TabId> = {
  nameAr: 'general', nameEn: 'general', slug: 'general', sku: 'general',
  barcode: 'general', brandId: 'general', categoryId: 'general', countryOfOrigin: 'general',
  basePrice: 'pricing', salePrice: 'pricing', compareAtPrice: 'pricing',
  costPrice: 'pricing', taxPercentage: 'pricing',
  weight: 'inventory', dimensions: 'inventory', minOrderQty: 'inventory',
  lowStockThreshold: 'inventory', trackInventory: 'inventory', requiresShipping: 'inventory',
  shortDescriptionAr: 'details', shortDescriptionEn: 'details',
  descriptionAr: 'details', descriptionEn: 'details', specifications: 'details', tags: 'details',
  mainImage: 'media', galleryImages: 'media', videoUrl: 'media', digitalFileUrl: 'media',
  metaTitle: 'seo', metaDescription: 'seo', keywords: 'seo',
  niche: 'advanced', attributes: 'advanced', warrantyPeriod: 'advanced', warrantyUnit: 'advanced',
};

// ─── Error Banner ─────────────────────────────────────────────
function ErrorBanner({ errors }: { errors: Record<string, unknown> }) {
  const msgs = Object.values(errors)
    .map((e: any) => e?.message as string | undefined)
    .filter(Boolean)
    .slice(0, 5) as string[];
  if (!msgs.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <ul className="space-y-0.5">
        {msgs.map((m, i) => <li key={`err-${i}`}>{m}</li>)}
      </ul>
    </div>
  );
}

// ─── Tab Nav ──────────────────────────────────────────────────
function TabNav({ active, onPrev, onNext }: { active: TabId; onPrev?: () => void; onNext?: () => void }) {
  const tabIndex = TABS.findIndex((t) => t.id === active);
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button type="button" variant="outline" onClick={onPrev} disabled={!onPrev} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Previous
      </Button>
      <span className="text-xs text-muted-foreground">{tabIndex + 1} / {TABS.length}</span>
      <Button type="button" variant="outline" onClick={onNext} disabled={!onNext} className="gap-1">
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PRODUCT FORM
// ═══════════════════════════════════════════════════════════════
export function ProductForm({
  initialData,
  onSubmit,
  isEditMode = false,
}: {
  initialData?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isEditMode?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  // 🏗️ Draft Product ID — obtained from backend on mount (create mode)
  // Backend creates a draft DB row first so all images use the real product_id as folder
  const [draftProductId, setDraftProductId] = useState<string | null>(
    (initialData as any)?.id ?? null  // edit mode: reuse existing id
  );
  const [draftInitializing, setDraftInitializing] = useState(!(initialData as any)?.id);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      slug: '',
      sku: '',
      barcode: undefined,
      countryOfOrigin: undefined,
      basePrice: 0,
      // Optional price fields: must default to undefined so they are not validated
      salePrice: undefined,
      compareAtPrice: undefined,
      costPrice: undefined,
      taxPercentage: 0,
      minOrderQty: 1,
      lowStockThreshold: 5,
      weight: undefined,
      dimHeight: 0,
      dimWidth: 0,
      dimLength: 0,
      trackInventory: true,
      requiresShipping: true,
      isDigital: false,
      isActive: true,
      isFeatured: false,
      isReturnable: true,
      niche: 'retail',
      attributes: {},
      specifications: {},
      galleryImages: [],
      tags: [],
      ...initialData,
    },
  });

  const { register, handleSubmit, setValue, getValues, control, formState: { errors } } = form;

  // 🏗️ Draft Initialization: create-mode only
  // Immediately reserve a real DB product_id so all media uploads use one unified folder
  useEffect(() => {
    if ((initialData as any)?.id) return; // edit mode — already has an id
    apiFetch<{ id: string }>('/merchant/products/draft', { method: 'POST' })
      .then(({ id }) => {
        setDraftProductId(id);
        setDraftInitializing(false);
      })
      .catch(() => {
        setDraftInitializing(false); // degrade gracefully — upload will fail with 400
        toast.error('Could not initialise product session. Please refresh.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDigital      = useWatch({ control, name: 'isDigital' });
  const niche          = useWatch({ control, name: 'niche' });
  const mainImage      = useWatch({ control, name: 'mainImage' });
  const galleryImages  = useWatch({ control, name: 'galleryImages' }) ?? [];
  const tags           = useWatch({ control, name: 'tags' }) ?? [];
  const specifications = useWatch({ control, name: 'specifications' }) ?? {};
  const attributes     = useWatch({ control, name: 'attributes' }) ?? {};
  const trackInventory = useWatch({ control, name: 'trackInventory' });
  const requiresShipping = useWatch({ control, name: 'requiresShipping' });
  const isActive       = useWatch({ control, name: 'isActive' });
  const isFeatured     = useWatch({ control, name: 'isFeatured' });
  const isReturnable   = useWatch({ control, name: 'isReturnable' });
  const warrantyUnit   = useWatch({ control, name: 'warrantyUnit' });

  // ─── Upload Handler ──────────────────────────────────────────
  async function handleImageUpload(file: File, key: string, onUrl: (url: string) => void) {
    if (!draftProductId) {
      toast.error('Product session not ready. Please wait a moment.');
      return;
    }
    try {
      setUploadingKey(key);
      const ct = encodeURIComponent(file.type);
      // productId MUST be passed — backend uses it as the folder name (no random client UUIDs)
      const endpoint = `/merchant/media/products/upload-url?contentType=${ct}&productId=${draftProductId}`;
      const { uploadUrl, publicUrl } = await apiFetch<{ uploadUrl: string; publicUrl: string }>(endpoint);
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      onUrl(publicUrl);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }


  // ─── Spec Helpers ─────────────────────────────────────────────
  function addSpec() {
    if (!specKey.trim() || !specVal.trim()) return;
    setValue('specifications', { ...specifications, [specKey.trim()]: specVal.trim() });
    setSpecKey(''); setSpecVal('');
  }
  function removeSpec(key: string) {
    const { [key]: _, ...rest } = specifications as Record<string, unknown>;
    setValue('specifications', rest as Record<string, string>);
  }

  // ─── Tag Helpers ─────────────────────────────────────────────
  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 30) return;
    setValue('tags', [...tags, t]);
    setTagInput('');
  }
  function removeTag(tag: string) {
    setValue('tags', tags.filter((t: string) => t !== tag));
  }

  // ─── Gallery Helpers ──────────────────────────────────────────
  function removeGalleryImage(idx: number) {
    setValue('galleryImages', (galleryImages as any[]).filter((_, i) => i !== idx));
  }

  // ─── Submit ───────────────────────────────────────────────────
  const handleFormSubmit = handleSubmit(
    async (data) => {
      setLoading(true);
      try {
        // Inject draftProductId so the page's onSubmit can call PUT /:draftId
        await onSubmit({ ...data, draftProductId } as any);
      } finally {
        setLoading(false);
      }
    },
    (fieldErrors) => {
      const firstTab = Object.keys(fieldErrors).map((k) => TAB_FIELD_MAP[k]).find(Boolean);
      if (firstTab) setActiveTab(firstTab);
      toast.error('Validation failed. Check highlighted fields for inline errors.');
    }
  );


  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditMode
              ? 'Update product details. SKU and slug are locked to preserve data integrity.'
              : 'Complete all sections to publish.'}
            {!isEditMode && <span className="text-destructive font-medium text-xs ml-1">* Required fields are marked with an asterisk</span>}
          </p>
        </div>
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="mb-6 grid h-auto w-full grid-cols-7 gap-1 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="flex flex-col items-center gap-1 py-2 text-xs">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── TAB 1: GENERAL ── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />General Information</CardTitle>
              <CardDescription>Product identity — names, SKU, and origin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ErrorBanner errors={errors as Record<string, unknown>} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nameAr">Arabic Name <span className="text-destructive">*</span></Label>
                  <Input id="nameAr" dir="rtl" placeholder="اسم المنتج" {...register('nameAr')} className={errors.nameAr ? 'border-destructive ring-destructive' : ''} />
                  {errors.nameAr && <p className="text-xs text-destructive">{errors.nameAr.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nameEn">English Name <span className="text-destructive">*</span></Label>
                  <Input id="nameEn" placeholder="Product Name" {...register('nameEn')} className={errors.nameEn ? 'border-destructive ring-destructive' : ''} />
                  {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message as string}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="flex items-center gap-1.5">
                    URL Slug <span className="text-destructive">*</span>
                    {isEditMode && <span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Read-only</span>}
                  </Label>
                  <Input
                    id="slug"
                    placeholder="my-product-slug"
                    {...register('slug')}
                    disabled={isEditMode}
                    className={`${errors.slug ? 'border-destructive ring-destructive' : ''} ${isEditMode ? 'cursor-not-allowed opacity-60 bg-muted/20' : ''}`}
                  />
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sku" className="flex items-center gap-1.5">
                    SKU <span className="text-destructive">*</span>
                    {isEditMode && <span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Read-only</span>}
                  </Label>
                  <Input
                    id="sku"
                    placeholder="WH-1000-XM5"
                    {...register('sku')}
                    disabled={isEditMode}
                    className={`${errors.sku ? 'border-destructive ring-destructive' : ''} ${isEditMode ? 'cursor-not-allowed opacity-60 bg-muted/20' : ''}`}
                  />
                  {errors.sku && <p className="text-xs text-destructive">{errors.sku.message as string}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" placeholder="1234567890" {...register('barcode')} className={errors.barcode ? 'border-destructive ring-destructive' : ''} />
                  {errors.barcode && <p className="text-xs text-destructive">{errors.barcode.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="countryOfOrigin">Country of Origin (2-letter)</Label>
                  <Input id="countryOfOrigin" placeholder="US" maxLength={2} {...register('countryOfOrigin')} className={errors.countryOfOrigin ? 'border-destructive ring-destructive' : ''} />
                  {errors.countryOfOrigin && <p className="text-xs text-destructive">{errors.countryOfOrigin.message as string}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="isDigital" className="text-sm font-medium">Digital Product</Label>
                  <p className="text-xs text-muted-foreground">Hides shipping fields, requires digital file URL</p>
                </div>
                <Switch id="isDigital" checked={Boolean(isDigital)} onCheckedChange={(v) => setValue('isDigital', v)} />
              </div>
            </CardContent>
          </Card>
          <TabNav active="general" onNext={() => setActiveTab('pricing')} />
        </TabsContent>

        {/* ── TAB 2: PRICING ── */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Pricing</CardTitle>
              <CardDescription>Base price, discounts, cost, and tax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="basePrice">Base Price <span className="text-destructive">*</span></Label>
                  <Input id="basePrice" type="number" step="0.01" min="0" placeholder="0.00" {...register('basePrice')} className={errors.basePrice ? 'border-destructive ring-destructive' : ''} />
                  {errors.basePrice && <p className="text-xs text-destructive mt-1">{errors.basePrice.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input id="salePrice" type="number" step="0.01" min="0" placeholder="0.00" {...register('salePrice')} className={errors.salePrice ? 'border-destructive ring-destructive' : ''} />
                  {errors.salePrice && <p className="text-xs text-destructive mt-1">{errors.salePrice.message as string}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="compareAtPrice">Compare-at Price</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" min="0" placeholder="0.00" {...register('compareAtPrice')} className={errors.compareAtPrice ? 'border-destructive ring-destructive' : ''} />
                  {errors.compareAtPrice && <p className="text-xs text-destructive mt-1">{errors.compareAtPrice.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input id="costPrice" type="number" step="0.01" min="0" placeholder="0.00" {...register('costPrice')} className={errors.costPrice ? 'border-destructive ring-destructive' : ''} />
                  {errors.costPrice && <p className="text-xs text-destructive mt-1">{errors.costPrice.message as string}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxPercentage">Tax Rate (%)</Label>
                <Input id="taxPercentage" type="number" step="0.01" min="0" max="100" placeholder="0" {...register('taxPercentage')} className={errors.taxPercentage ? 'border-destructive ring-destructive' : ''} />
                {errors.taxPercentage && <p className="text-xs text-destructive mt-1">{errors.taxPercentage.message as string}</p>}
              </div>
            </CardContent>
          </Card>
          <TabNav active="pricing" onPrev={() => setActiveTab('general')} onNext={() => setActiveTab('inventory')} />
        </TabsContent>

        {/* ── TAB 3: INVENTORY ── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Inventory & Logistics</CardTitle>
              <CardDescription>Stock, shipping, weight, and dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="minOrderQty">Min. Order Quantity <span className="text-destructive">*</span></Label>
                  <Input id="minOrderQty" type="number" min="1" placeholder="1" {...register('minOrderQty')} className={errors.minOrderQty ? 'border-destructive ring-destructive' : ''} />
                  {errors.minOrderQty && <p className="text-xs text-destructive mt-1">{errors.minOrderQty.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input id="lowStockThreshold" type="number" min="0" placeholder="5" {...register('lowStockThreshold')} className={errors.lowStockThreshold ? 'border-destructive ring-destructive' : ''} />
                  {errors.lowStockThreshold && <p className="text-xs text-destructive mt-1">{errors.lowStockThreshold.message as string}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="trackInventory" className="font-medium">Track Inventory</Label>
                <Switch id="trackInventory" checked={Boolean(trackInventory)} onCheckedChange={(v) => setValue('trackInventory', v)} />
              </div>

              {/* CONDITIONAL: hidden for digital products */}
              {!isDigital && (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="requiresShipping" className="font-medium">Requires Shipping</Label>
                      <p className="text-xs text-muted-foreground">Hidden for digital products</p>
                    </div>
                    <Switch id="requiresShipping" checked={Boolean(requiresShipping)} onCheckedChange={(v) => setValue('requiresShipping', v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Weight (grams)</Label>
                    <Input id="weight" type="number" min="0" step="1" placeholder="500" {...register('weight')} className={errors.weight ? 'border-destructive ring-destructive' : ''} />
                    {errors.weight && <p className="text-xs text-destructive mt-1">{errors.weight.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Height</Label>
                        <Input type="number" min="0" step="0.1" placeholder="0" {...register('dimHeight' as any)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width</Label>
                        <Input type="number" min="0" step="0.1" placeholder="0" {...register('dimWidth' as any)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Length</Label>
                        <Input type="number" min="0" step="0.1" placeholder="0" {...register('dimLength' as any)} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isDigital && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400">
                  Weight, dimensions, and shipping fields are hidden for digital products.
                </div>
              )}
            </CardContent>
          </Card>
          <TabNav active="inventory" onPrev={() => setActiveTab('pricing')} onNext={() => setActiveTab('details')} />
        </TabsContent>

        {/* ── TAB 4: DETAILS ── */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Product Details</CardTitle>
              <CardDescription>Descriptions, specifications, and tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shortDescriptionAr">Short Description (Arabic)</Label>
                  <Textarea id="shortDescriptionAr" dir="rtl" placeholder="وصف مختصر..." rows={3} {...register('shortDescriptionAr')} className={errors.shortDescriptionAr ? 'border-destructive ring-destructive' : ''} />
                  {errors.shortDescriptionAr && <p className="text-xs text-destructive mt-1">{errors.shortDescriptionAr.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shortDescriptionEn">Short Description (English)</Label>
                  <Textarea id="shortDescriptionEn" placeholder="Short description..." rows={3} {...register('shortDescriptionEn')} className={errors.shortDescriptionEn ? 'border-destructive ring-destructive' : ''} />
                  {errors.shortDescriptionEn && <p className="text-xs text-destructive mt-1">{errors.shortDescriptionEn.message as string}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="descriptionAr">Full Description (Arabic)</Label>
                  <Textarea id="descriptionAr" dir="rtl" placeholder="وصف تفصيلي..." rows={6} {...register('descriptionAr')} className={errors.descriptionAr ? 'border-destructive ring-destructive' : ''} />
                  {errors.descriptionAr && <p className="text-xs text-destructive mt-1">{errors.descriptionAr.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descriptionEn">Full Description (English)</Label>
                  <Textarea id="descriptionEn" placeholder="Full description..." rows={6} {...register('descriptionEn')} className={errors.descriptionEn ? 'border-destructive ring-destructive' : ''} />
                  {errors.descriptionEn && <p className="text-xs text-destructive mt-1">{errors.descriptionEn.message as string}</p>}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <Label>Specifications (Key–Value)</Label>
                <div className="flex gap-2">
                  <Input placeholder="Key (e.g. Color)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
                  <Input placeholder="Value (e.g. Red)" value={specVal} onChange={(e) => setSpecVal(e.target.value)} />
                  <Button type="button" variant="outline" onClick={addSpec}>Add</Button>
                </div>
                {Object.entries(specifications as Record<string, unknown>).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(specifications as Record<string, unknown>).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="gap-1">
                        <span className="font-medium">{k}:</span> {String(v)}
                        <button type="button" onClick={() => removeSpec(k)} className="ml-1 text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label>Tags (max 30)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(tags as string[]).map((tag) => (
                      <Badge key={tag} variant="outline" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <TabNav active="details" onPrev={() => setActiveTab('inventory')} onNext={() => setActiveTab('media')} />
        </TabsContent>

        {/* ── TAB 5: MEDIA ── */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Media</CardTitle>
              <CardDescription>Images, videos, and digital file links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Image */}
              <div className="space-y-2">
                <Label>Main Image <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-4">
                  {mainImage && (
                    <div className="h-24 w-24 overflow-hidden rounded-lg border">
                      <Image src={mainImage as string} alt="Main product" width={96} height={96} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <label className={`flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm ${draftInitializing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'} ${errors.mainImage ? 'border-destructive text-destructive' : ''}`}>
                    {uploadingKey === 'main' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {uploadingKey === 'main' ? 'Uploading...' : 'Upload Main Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={draftInitializing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'main', (url) => setValue('mainImage', url));
                      }}
                    />
                  </label>
                </div>
                {errors.mainImage && <p className="text-xs text-destructive mt-1">{errors.mainImage.message as string}</p>}
              </div>

              {/* Gallery */}
              <div className="space-y-2">
                <Label>Gallery Images</Label>
                <div className="flex flex-wrap gap-3">
                  {(galleryImages as Array<{ url: string; altText?: string; order: number }>).map((img, idx) => (
                    <div key={`gallery-${img.url}-${idx}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
                      <Image src={img.url} alt={img.altText ?? `Gallery ${idx + 1}`} width={96} height={96} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute right-1 top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                      >×</button>
                    </div>
                  ))}
                  <label className={`flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground ${draftInitializing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}`}>
                    {uploadingKey === 'gallery' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    Add Image
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      className="hidden"
                      disabled={draftInitializing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'gallery', (url) => {
                          const current = getValues('galleryImages') ?? [];
                          setValue('galleryImages', [...current, { url, order: current.length, altText: '' }]);
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="videoUrl">Video URL (optional)</Label>
                <Input id="videoUrl" placeholder="https://..." {...register('videoUrl')} className={errors.videoUrl ? 'border-destructive ring-destructive' : ''} />
                {errors.videoUrl && <p className="text-xs text-destructive mt-1">{errors.videoUrl.message as string}</p>}
              </div>

              {/* CONDITIONAL: digital file URL */}
              {isDigital && (
                <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <Label htmlFor="digitalFileUrl" className="font-medium text-amber-700 dark:text-amber-400">
                    Digital File URL <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Required for digital products</p>
                  <Input id="digitalFileUrl" placeholder="https://storage.60sec.shop/..." {...register('digitalFileUrl')} className={errors.digitalFileUrl ? 'border-destructive ring-destructive' : ''} />
                  {errors.digitalFileUrl && <p className="text-xs text-destructive mt-1">{errors.digitalFileUrl.message as string}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <TabNav active="media" onPrev={() => setActiveTab('details')} onNext={() => setActiveTab('seo')} />
        </TabsContent>

        {/* ── TAB 6: SEO ── */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />SEO & Visibility</CardTitle>
              <CardDescription>Search engine meta tags and publication controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="metaTitle">Meta Title (max 70 chars)</Label>
                <Input id="metaTitle" placeholder="Product | Store Name" maxLength={70} {...register('metaTitle')} className={errors.metaTitle ? 'border-destructive ring-destructive' : ''} />
                {errors.metaTitle && <p className="text-xs text-destructive mt-1">{errors.metaTitle.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metaDescription">Meta Description (max 160 chars)</Label>
                <Textarea id="metaDescription" placeholder="A short summary for search engines..." maxLength={160} rows={3} {...register('metaDescription')} className={errors.metaDescription ? 'border-destructive ring-destructive' : ''} />
                {errors.metaDescription && <p className="text-xs text-destructive mt-1">{errors.metaDescription.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" placeholder="headphones, wireless, noise-cancelling" {...register('keywords')} className={errors.keywords ? 'border-destructive ring-destructive' : ''} />
                {errors.keywords && <p className="text-xs text-destructive mt-1">{errors.keywords.message as string}</p>}
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-medium">Visibility Settings</h3>
                {([
                  { field: 'isActive',     value: isActive,     label: 'Active',      desc: 'Product is live on the storefront' },
                  { field: 'isFeatured',   value: isFeatured,   label: 'Featured',    desc: 'Show in featured products section' },
                  { field: 'isReturnable', value: isReturnable, label: 'Returnable',  desc: 'Customer can request a return' },
                ] as const).map(({ field, value, label, desc }) => (
                  <div key={field} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={field} className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch id={field} checked={Boolean(value)} onCheckedChange={(v) => setValue(field, v)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <TabNav active="seo" onPrev={() => setActiveTab('media')} onNext={() => setActiveTab('advanced')} />
        </TabsContent>

        {/* ── TAB 7: ADVANCED ── */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Advanced</CardTitle>
              <CardDescription>Niche, dynamic attributes, and warranty</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="niche">Product Niche <span className="text-destructive">*</span></Label>
                <Select
                  value={niche ?? 'retail'}
                  onValueChange={(v) => { setValue('niche', v as any); setValue('attributes', {} as any); }}
                >
                  <SelectTrigger id="niche" className={errors.niche ? 'border-destructive ring-destructive' : ''}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['retail', 'wellness', 'education', 'services', 'hospitality', 'real_estate', 'creative'] as const).map((n) => (
                      <SelectItem key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1).replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.niche && <p className="text-xs text-destructive mt-1">{errors.niche.message as string}</p>}
              </div>

              {/* Dynamic niche attributes — all watchers already hoisted above */}
              <NicheAttributesPanel
                niche={niche as string}
                attributes={attributes as Record<string, unknown>}
                onAttributeChange={(key, value) => setValue('attributes', { ...(attributes as Record<string, unknown>), [key]: value } as any)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                  <Input id="warrantyPeriod" type="number" min="1" placeholder="12" {...register('warrantyPeriod')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="warrantyUnit">Warranty Unit</Label>
                  <Select value={warrantyUnit ?? ''} onValueChange={(v) => setValue('warrantyUnit', v as any)}>
                    <SelectTrigger id="warrantyUnit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {(['days', 'months', 'years'] as const).map((u) => (
                        <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <TabNav active="advanced" onPrev={() => setActiveTab('seo')} />

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading} size="lg" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? 'Creating Product...' : 'Create Product'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// NICHE ATTRIBUTES PANEL (pure component, no hooks)
// ═══════════════════════════════════════════════════════════════
function NicheAttributesPanel({
  niche,
  attributes,
  onAttributeChange,
}: {
  niche: string;
  attributes: Record<string, unknown>;
  onAttributeChange: (key: string, value: unknown) => void;
}) {
  if (!niche || niche === 'retail') return (
    <div className="space-y-3">
      <Label>Retail Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-3">
        {([['material', 'Material'], ['color', 'Color'], ['size', 'Size']] as const).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input placeholder={label} value={String(attributes[key] ?? '')} onChange={(e) => onAttributeChange(key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );

  if (niche === 'wellness') return (
    <div className="space-y-3">
      <Label>Wellness Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Duration (min) <span className="text-destructive">*</span></Label>
          <Input type="number" min="1" placeholder="60" value={String(attributes.duration_min ?? '')}
            onChange={(e) => onAttributeChange('duration_min', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Practitioner</Label>
          <Input placeholder="Dr. Smith" value={String(attributes.practitioner ?? '')}
            onChange={(e) => onAttributeChange('practitioner', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Session Type <span className="text-destructive">*</span></Label>
          <Select value={String(attributes.session_type ?? '')} onValueChange={(v) => onAttributeChange('session_type', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {['one-on-one', 'group', 'workshop'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (niche === 'education') return (
    <div className="space-y-3">
      <Label>Education Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Instructor <span className="text-destructive">*</span></Label>
          <Input placeholder="Instructor Name" value={String(attributes.instructor ?? '')}
            onChange={(e) => onAttributeChange('instructor', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lessons Count <span className="text-destructive">*</span></Label>
          <Input type="number" min="1" placeholder="10" value={String(attributes.lessons_count ?? '')}
            onChange={(e) => onAttributeChange('lessons_count', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Level <span className="text-destructive">*</span></Label>
          <Select value={String(attributes.level ?? '')} onValueChange={(v) => onAttributeChange('level', v)}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              {['beginner', 'intermediate', 'advanced'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label className="text-xs">Has Certificate</Label>
          <Switch checked={Boolean(attributes.has_certificate)}
            onCheckedChange={(v) => onAttributeChange('has_certificate', v)} />
        </div>
      </div>
    </div>
  );

  if (niche === 'real_estate') return (
    <div className="space-y-3">
      <Label>Real Estate Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['sqft', 'Area (sqft)']] as const).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs">{label} <span className="text-destructive">*</span></Label>
            <Input type="number" min="0" placeholder="0" value={String(attributes[key] ?? '')}
              onChange={(e) => onAttributeChange(key, Number(e.target.value))} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs">Property Type <span className="text-destructive">*</span></Label>
          <Select value={String(attributes.property_type ?? '')} onValueChange={(v) => onAttributeChange('property_type', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {['apartment', 'house', 'commercial', 'land'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (niche === 'services') return (
    <div className="space-y-3">
      <Label>Services Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Service Category <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Consulting" value={String(attributes.service_category ?? '')}
            onChange={(e) => onAttributeChange('service_category', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hourly Rate</Label>
          <Input type="number" min="0" placeholder="0.00" value={String(attributes.hourly_rate ?? '')}
            onChange={(e) => onAttributeChange('hourly_rate', Number(e.target.value))} />
        </div>
      </div>
    </div>
  );

  if (niche === 'creative') return (
    <div className="space-y-3">
      <Label>Creative Attributes</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Medium <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Oil on Canvas" value={String(attributes.medium ?? '')}
            onChange={(e) => onAttributeChange('medium', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dimensions (cm)</Label>
          <Input placeholder="50x70" value={String(attributes.dimensions_cm ?? '')}
            onChange={(e) => onAttributeChange('dimensions_cm', e.target.value)} />
        </div>
      </div>
    </div>
  );

  if (niche === 'hospitality') return (
    <div className="space-y-3">
      <Label>Hospitality Attributes</Label>
      <div className="space-y-1.5">
        <Label className="text-xs">Capacity <span className="text-destructive">*</span></Label>
        <Input type="number" min="1" placeholder="50" value={String(attributes.capacity ?? '')}
          onChange={(e) => onAttributeChange('capacity', Number(e.target.value))} />
      </div>
    </div>
  );

  return null;
}
