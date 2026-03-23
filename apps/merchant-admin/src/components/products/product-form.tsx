'use client';

import { type CreateProductInput, CreateProductSchema } from '@apex/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DollarSign,
  FileText,
  Loader2,
  Package,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { NicheAttributes } from './niche-attributes';

// Schema is now imported from @apex/validation

type ProductFormData = CreateProductInput;

export function ProductForm({
  initialData,
  onSubmit,
}: {
  initialData?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState<string | null>(null);

  useEffect(() => {
    const fetchNiche = async () => {
      try {
        const config = await apiFetch<{
          niche?: CreateProductInput['niche'];
          [key: string]: unknown;
        }>('/merchant/config');
        setNiche(config.niche || 'retail');
      } catch (err) {
        console.error('Failed to fetch store niche', err);
        setNiche('retail');
      }
    };
    fetchNiche();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: initialData || {
      nameAr: '',
      nameEn: '',
      slug: '',
      sku: '',
      mainImage: '',
      taxPercentage: 0,
      stockQuantity: 0,
      niche: 'retail',
      attributes: {},
      specifications: {},
    },
  });

  // Automatically update form niche once fetched
  useEffect(() => {
    if (niche) {
      setValue('niche', niche as CreateProductInput['niche']);
    }
  }, [niche, setValue]);

  const onFormSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-12 pb-24">
      {/* Sticky Header for Actions */}
      <div className="sticky top-0 z-50 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between transition-all">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {initialData ? `Editing SKU: ${initialData.sku}` : 'Fill in all details to launch your product'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-white/10"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="rounded-xl shadow-xl hover:shadow-primary/20 transition-all gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {initialData ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Sidebar (ScrollSpy-style hints) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-32 h-fit">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-4">Sections</p>
          <nav className="flex flex-col gap-1">
            {['Primary', 'Pricing', 'Logistics', 'Content', 'Policies', 'SEO', 'Specs'].map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary/50 text-muted-foreground hover:text-white"
              >
                {s}
              </a>
            ))}
          </nav>
        </div>

        {/* Form Body */}
        <div className="lg:col-span-9 space-y-16">
          {/* 1. Primary Info */}
          <section id="primary" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
              <Package className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Primary Information</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 backdrop-blur-sm overflow-hidden border-none shadow-2xl">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="nameEn" className="text-sm font-semibold opacity-70">English Name</Label>
                  <Input
                    id="nameEn"
                    {...register('nameEn')}
                    className="bg-background/50 h-12 rounded-xl border-white/5 focus:border-indigo-500/50 transition-all"
                    placeholder="e.g. Wireless Headset"
                  />
                  {errors.nameEn && (
                    <p className="text-xs text-destructive">{errors.nameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr" className="text-sm font-semibold opacity-70">Arabic Name</Label>
                  <Input
                    id="nameAr"
                    {...register('nameAr')}
                    className="bg-background/50 h-12 rounded-xl border-white/5 text-right focus:border-indigo-500/50 transition-all"
                    dir="rtl"
                    placeholder="مثلاً: سماعة لاسلكية"
                  />
                  {errors.nameAr && (
                    <p className="text-xs text-destructive">{errors.nameAr.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-semibold opacity-70">Slug (URL)</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    className="bg-background/50 h-12 rounded-xl border-white/5 focus:border-indigo-500/50 transition-all"
                    placeholder="wireless-headset"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold opacity-70">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    className="bg-background/50 h-12 rounded-xl border-white/5 focus:border-indigo-500/50 transition-all"
                    placeholder="WH-1000-XM5"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 2. Pricing & Inventory */}
          <section id="pricing" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold">Pricing & Inventory</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 backdrop-blur-sm border-none shadow-2xl">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="basePrice" className="text-sm font-semibold opacity-70">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    {...register('basePrice')}
                    className="bg-background/50 h-12 rounded-xl border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-sm font-semibold opacity-70">Sale Price ($)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...register('salePrice')}
                    className="bg-background/50 h-12 rounded-xl border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage" className="text-sm font-semibold opacity-70">Tax (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    {...register('taxPercentage')}
                    className="bg-background/50 h-12 rounded-xl border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity" className="text-sm font-semibold opacity-70">Stock Level</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    {...register('stockQuantity')}
                    className="bg-background/50 h-12 rounded-xl border-white/5"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. Logistics */}
          <section id="logistics" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
              <Truck className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold">Technical & Logistics</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 backdrop-blur-sm border-none shadow-2xl">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-semibold opacity-70">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.001"
                    {...register('weight')}
                    className="bg-background/50 h-12 rounded-xl border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold opacity-70">Origin</Label>
                  <Select>
                    <SelectTrigger className="bg-background/50 h-12 rounded-xl border-white/5">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10">
                      <SelectItem value="cn">China</SelectItem>
                      <SelectItem value="us">USA</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 4. Content & Media */}
          <section id="content" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-sky-500 pl-4">
              <FileText className="h-5 w-5 text-sky-400" />
              <h2 className="text-xl font-bold">Content & Media</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 backdrop-blur-sm border-none shadow-2xl">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-sm font-semibold opacity-70">Visual Assets</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <button
                      type="button"
                      className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                      onClick={() => document.getElementById('media-upload')?.click()}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs text-muted-foreground mt-2 group-hover:text-indigo-300">Add Media</span>
                    </button>
                    <input
                      id="media-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;
                        for (const file of Array.from(files)) {
                          try {
                            const { uploadUrl, publicUrl } = await apiFetch<{
                              uploadUrl: string;
                              publicUrl: string;
                            }>(`/merchant/media/products/upload-url?contentType=${file.type}`);
                            await fetch(uploadUrl, {
                              method: 'PUT',
                              body: file,
                              headers: { 'Content-Type': file.type },
                            });
                            const current = watch('galleryImages') || [];
                            const newImage = { url: publicUrl, altText: file.name, order: current.length };
                            setValue('galleryImages', [...current, newImage]);
                            if (!watch('mainImage') || current.length === 0) {
                              setValue('mainImage', publicUrl);
                            }
                          } catch (err) {
                            console.error('Upload failed', err);
                          }
                        }
                      }}
                    />

                    {watch('galleryImages')?.map((img, idx) => (
                      <div key={img.url} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10 shadow-lg">
                        <Image src={img.url} alt={`Gallery ${idx + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={watch('mainImage') === img.url ? 'default' : 'secondary'}
                            className="h-8 text-[10px] rounded-lg px-2"
                            onClick={() => setValue('mainImage', img.url)}
                          >
                            {watch('mainImage') === img.url ? 'PRIMARY IMAGE' : 'SET AS PRIMARY'}
                          </Button>
                          <button
                            type="button"
                            className="p-2 bg-red-500/80 hover:bg-red-500 rounded-xl transition-colors shadow-lg"
                            onClick={async () => {
                              await apiFetch(`/merchant/media/products?url=${encodeURIComponent(img.url)}`, { method: 'DELETE' });
                              const current = watch('galleryImages');
                              const newGallery = current.filter((_, i) => i !== idx);
                              setValue('galleryImages', newGallery);
                              if (watch('mainImage') === img.url) {
                                setValue('mainImage', newGallery[0]?.url || '');
                              }
                            }}
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescriptionEn" className="text-sm font-semibold opacity-70">Short Description (EN)</Label>
                  <Textarea
                    id="shortDescriptionEn"
                    {...register('shortDescriptionEn')}
                    className="bg-background/50 h-32 rounded-xl border-white/5 focus:border-indigo-500/50 transition-all"
                    placeholder="Brief highlight of the product..."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 5. Policies */}
          <section id="policies" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4">
              <ShieldCheck className="h-5 w-5 text-rose-400" />
              <h2 className="text-xl font-bold">Policies</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 h-48 flex flex-col items-center justify-center text-muted-foreground border-none shadow-2xl">
              <Settings2 className="w-8 h-8 opacity-20 mb-4" />
              <p className="text-sm">Policy fields coming soon to this space...</p>
            </Card>
          </section>

          {/* 6. SEO */}
          <section id="seo" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-indigo-400 pl-4">
              <Search className="h-5 w-5 text-indigo-300" />
              <h2 className="text-xl font-bold">SEO Optimization</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 h-48 flex flex-col items-center justify-center text-muted-foreground border-none shadow-2xl">
              <Search className="w-8 h-8 opacity-20 mb-4" />
              <p className="text-sm">Metadata and social sharing previews coming soon...</p>
            </Card>
          </section>

          {/* 7. Specs */}
          <section id="specs" className="scroll-mt-32 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
              <Settings2 className="h-5 w-5 text-primary/80" />
              <h2 className="text-xl font-bold">Niche Specifications</h2>
            </div>
            <Card className="border-white/10 bg-muted/20 backdrop-blur-sm border-none shadow-2xl">
              <CardContent className="p-8">
                {niche ? (
                  <NicheAttributes
                    niche={niche}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    watch={watch}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Identifying store niche...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </form>
  );
}
