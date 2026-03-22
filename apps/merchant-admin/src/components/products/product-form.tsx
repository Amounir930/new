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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details across the 7 specialized sections.
          </p>
        </div>
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

      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1.5 scrollbar-hide">
          <TabsTrigger value="primary" className="gap-2 shrink-0">
            <Package className="h-4 w-4" /> Primary
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2 shrink-0">
            <DollarSign className="h-4 w-4" /> Pricing
          </TabsTrigger>
          <TabsTrigger value="logistics" className="gap-2 shrink-0">
            <Truck className="h-4 w-4" /> Logistics
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2 shrink-0">
            <FileText className="h-4 w-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 shrink-0">
            <ShieldCheck className="h-4 w-4" /> Policies
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 shrink-0">
            <Search className="h-4 w-4" /> SEO
          </TabsTrigger>
          <TabsTrigger value="specs" className="gap-2 shrink-0">
            <Settings2 className="h-4 w-4" /> Specs
          </TabsTrigger>
        </TabsList>

        {/* 1. Primary Info */}
        <TabsContent value="primary">
          <Card className="border-white/10 bg-muted/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Primary Information</CardTitle>
              <CardDescription>
                Basic identification and categorization.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nameEn">English Name</Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  className="bg-background/50"
                  placeholder="e.g. Wireless Headset"
                />
                {errors.nameEn && (
                  <p className="text-xs text-destructive">
                    {errors.nameEn.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">Arabic Name</Label>
                <Input
                  id="nameAr"
                  {...register('nameAr')}
                  className="bg-background/50 text-right"
                  dir="rtl"
                  placeholder="مثلاً: سماعة لاسلكية"
                />
                {errors.nameAr && (
                  <p className="text-xs text-destructive">
                    {errors.nameAr.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="bg-background/50"
                  placeholder="wireless-headset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register('sku')}
                  className="bg-background/50"
                  placeholder="WH-1000-XM5"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Pricing & Inventory */}
        <TabsContent value="pricing">
          <Card className="border-white/10 bg-muted/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Financial and stock management.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price ($)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...register('basePrice')}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...register('salePrice')}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxPercentage">Tax (%)</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  {...register('taxPercentage')}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  {...register('stockQuantity')}
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Technical & Logistics */}
        <TabsContent value="logistics">
          <Card className="border-white/10 bg-muted/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Technical & Logistics</CardTitle>
              <CardDescription>
                Shipping and technical specifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  {...register('weight')}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin</Label>
                <Select>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cn">China</SelectItem>
                    <SelectItem value="us">USA</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Content & Media */}
        <TabsContent value="content">
          <Card className="border-white/10 bg-muted/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Content & Media</CardTitle>
              <CardDescription>Visuals and descriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Product Images (Upload to Temp)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Simplified Media Grid */}
                  <button
                    type="button"
                    className="border-2 border-dashed border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors"
                    onClick={() =>
                      document.getElementById('media-upload')?.click()
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        document.getElementById('media-upload')?.click();
                      }
                    }}
                    aria-label="Upload Product Image"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-2">
                      Add Image
                    </span>
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
                          // 1. Get Presigned URL
                          const { uploadUrl, publicUrl } = await apiFetch<{
                            uploadUrl: string;
                            publicUrl: string;
                          }>(
                            `/merchant/media/products/upload-url?contentType=${file.type}`
                          );
                          // 2. Direct PUT to S3
                          await fetch(uploadUrl, {
                            method: 'PUT',
                            body: file,
                            headers: { 'Content-Type': file.type },
                          });
                          // 3. Update Form State
                          const current = watch('galleryImages') || [];
                          setValue('galleryImages', [
                            ...current,
                            {
                              url: publicUrl,
                              altText: file.name,
                              order: current.length,
                            },
                          ]);
                        } catch (err) {
                          console.error('Upload failed', err);
                        }
                      }
                    }}
                  />

                  {watch('galleryImages')?.map((img, idx) => (
                    <div
                      key={img.url}
                      className="relative aspect-square rounded-xl overflow-hidden group border border-white/10"
                    >
                      <Image
                        src={img.url}
                        alt={`Gallery ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          await apiFetch(
                            `/merchant/media/products?url=${encodeURIComponent(img.url)}`,
                            { method: 'DELETE' }
                          );
                          const current = watch('galleryImages');
                          setValue(
                            'galleryImages',
                            current.filter((_, i) => i !== idx)
                          );
                        }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescriptionEn">
                  Short Description (EN)
                </Label>
                <Textarea
                  id="shortDescriptionEn"
                  {...register('shortDescriptionEn')}
                  className="bg-background/50 h-24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5, 6, 7 Placeholders for now to avoid massive file, but structure is there */}
        <TabsContent value="policies">
          <Card className="border-white/10 bg-muted/20 h-48 flex items-center justify-center text-muted-foreground italic">
            Policy fields coming soon...
          </Card>
        </TabsContent>
        <TabsContent value="seo">
          <Card className="border-white/10 bg-muted/20 h-48 flex items-center justify-center text-muted-foreground italic">
            SEO Metadata fields coming soon...
          </Card>
        </TabsContent>
        <TabsContent value="specs">
          <Card className="border-white/10 bg-muted/20 backdrop-blur-sm p-6">
            {niche ? (
              <NicheAttributes
                niche={niche}
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            ) : (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
