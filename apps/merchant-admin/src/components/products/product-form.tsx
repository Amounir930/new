'use client';

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
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

// Reuse the schema logic from the API DTO (simplified for frontend)
const ProductSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be valid URL format (lowercase, numbers, dashes)'
    ),
  sku: z.string().min(1, 'SKU is required'),
  basePrice: z.coerce.number().min(0, 'Base price must be positive'),
  salePrice: z.coerce.number().min(0, 'Sale price must be positive').optional(),
  taxPercentage: z.coerce
    .number()
    .min(0, 'Tax cannot be negative')
    .max(100, 'Tax cannot exceed 100%')
    .default(0),
  stockQuantity: z.coerce
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .default(0),
  weight: z.coerce.number().min(0, 'Weight cannot be negative').optional(),
  mainImage: z.string().url('Main image must be a valid URL'),
  shortDescriptionAr: z.string().max(1000).optional(),
  shortDescriptionEn: z.string().max(1000).optional(),
  metaTitle: z.string().max(70, 'Meta title too long').optional(),
  metaDescription: z.string().max(160, 'Meta description too long').optional(),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof ProductSchema>;

export function ProductForm({
  initialData,
  onSubmit,
}: {
  initialData?: unknown;
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData || {
      isActive: true,
      taxPercentage: 0,
      stockQuantity: 0,
    },
  });

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
              <div className="space-y-2">
                <Label htmlFor="mainImage">Main Image URL</Label>
                <Input
                  id="mainImage"
                  {...register('mainImage')}
                  className="bg-background/50"
                  placeholder="https://..."
                />
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
          <Card className="border-white/10 bg-muted/20 h-48 flex items-center justify-center text-muted-foreground italic">
            Dynamic Sector Specifications...
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
