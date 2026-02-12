'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, Eye, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { language } = useSettings();
  const image = PlaceHolderImages.find((img) => img.id === product.images[0]);
  const onSale = product.originalPrice && product.originalPrice > product.price;

  // State for Quick View Modal
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (product) {
      const initialVariants: { [key: string]: string } = {};
      Object.keys(product.variants).forEach((key) => {
        initialVariants[key] = product.variants[key][0];
      });
      setSelectedVariants(initialVariants);
    }
  }, [product]);

  const t = {
    en: {
      new: 'New',
      sale: 'Sale',
      quickView: 'Quick View',
      reviews: 'reviews',
      addToCart: 'Add to Cart',
      fullDetails: 'View Full Details',
      select: 'Select',
    },
    ar: {
      new: 'جديد',
      sale: 'خصم',
      quickView: 'نظرة سريعة',
      reviews: 'تقييمات',
      addToCart: 'أضف إلى السلة',
      fullDetails: 'عرض التفاصيل الكاملة',
      select: 'اختر',
    },
  };

  const handleQuickAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, quantity, selectedVariants);
    setIsQuickViewOpen(false); // Close modal after adding to cart
  };

  const handleVariantChange = (variantKey: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantKey]: value }));
  };

  return (
    <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
      <div className="group relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
          <Link
            href={`/shop/product/${product.slug}`}
            className="block h-full w-full"
          >
            {image && (
              <Image
                src={image.imageUrl}
                alt={product.name}
                fill
                className="object-cover object-center transition-opacity group-hover:opacity-75"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                data-ai-hint={image.imageHint}
              />
            )}
          </Link>
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.tags?.includes('new-arrival') && (
              <Badge>{t[language].new}</Badge>
            )}
            {onSale && <Badge variant="destructive">{t[language].sale}</Badge>}
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <DialogTrigger asChild>
              <Button className="w-full" variant="secondary">
                <Eye className="mr-2 h-4 w-4" /> {t[language].quickView}
              </Button>
            </DialogTrigger>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <div>
            <h3 className="text-sm text-foreground">
              <Link href={`/shop/product/${product.slug}`}>
                <span aria-hidden="true" className="absolute inset-0" />
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.brand}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(product.price)}
            </p>
            {onSale && (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice!)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="ml-1 text-xs text-muted-foreground">
            {product.rating} ({product.reviewCount} {t[language].reviews})
          </span>
        </div>
      </div>
      <DialogContent className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
            {image && (
              <Image
                src={image.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={image.imageHint}
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {product.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold">
                {formatCurrency(product.price)}
              </p>
              {onSale && (
                <p className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice!)}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
            <Separator />
            <div className="space-y-4">
              {Object.entries(product.variants).map(([key, values]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-base font-medium">
                    {t[language].select} {key}
                  </Label>
                  <RadioGroup
                    value={selectedVariants[key]}
                    onValueChange={(value) => handleVariantChange(key, value)}
                    className="flex flex-wrap gap-2"
                  >
                    {values.map((value) => (
                      <div key={value}>
                        <RadioGroupItem
                          value={value}
                          id={`qv-${key}-${value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`qv-${key}-${value}`}
                          className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex items-center gap-2 rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleQuickAddToCart}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t[language].addToCart}
              </Button>
            </div>
            <Button asChild variant="link" className="justify-center">
              <Link href={`/shop/product/${product.slug}`}>
                {t[language].fullDetails}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
