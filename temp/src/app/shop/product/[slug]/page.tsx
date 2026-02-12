'use client';

import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { products } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Truck, RefreshCw, Shield, Minus, Plus, Ruler, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductCard } from '@/components/products/ProductCard';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aiSizeGuideRecommendation, AiSizeGuideRecommendationOutput } from '@/ai/flows/ai-size-guide-recommendation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsProvider';

const sizeGuideFormSchema = z.object({
  chestMeasurementCm: z.coerce.number().min(50, "Please enter a valid measurement.").max(200, "Please enter a valid measurement."),
  waistMeasurementCm: z.coerce.number().min(50, "Please enter a valid measurement.").max(200, "Please enter a valid measurement."),
  hipMeasurementCm: z.coerce.number().min(50, "Please enter a valid measurement.").max(200, "Please enter a valid measurement."),
  inseamMeasurementCm: z.coerce.number().optional(),
  preferredFit: z.enum(['loose', 'regular', 'tight']),
});

type SizeGuideFormValues = z.infer<typeof sizeGuideFormSchema>;

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const product = useMemo(() => products.find(p => p.slug === params?.slug), [params?.slug]);
  
  const { toast } = useToast();
  const { language } = useSettings();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const { addToCart } = useCart();
  
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeRecommendation, setSizeRecommendation] = useState<AiSizeGuideRecommendationOutput | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  const form = useForm<SizeGuideFormValues>({
    resolver: zodResolver(sizeGuideFormSchema),
    defaultValues: {
      preferredFit: 'regular',
    },
  });

  useEffect(() => {
    if (product) {
      const initialVariants: { [key: string]: string } = {};
      Object.keys(product.variants).forEach(key => {
        initialVariants[key] = product.variants[key][0];
      });
      setSelectedVariants(initialVariants);
    }
  }, [product]);

  const t = {
    en: {
        sale: "SALE",
        reviews: "reviews",
        select: "Select",
        aiRecommender: "AI Size Recommender",
        addToCart: "Add to Cart",
        shippingFeature: "Free Shipping over $50",
        returnsFeature: "30-Day Easy Returns",
        paymentFeature: "Secure Payments",
        relatedTitle: "You Might Also Like",
        sizeGuideTitle: "AI Size Recommender",
        sizeGuideDesc: "Enter your measurements in CM to get a personalized size recommendation.",
        chest: "Chest (cm)",
        waist: "Waist (cm)",
        hips: "Hips (cm)",
        inseam: "Inseam (cm)",
        preferredFit: "Preferred Fit",
        tight: "Tight",
        regular: "Regular",
        loose: "Loose",
        getRecommendation: "Get Recommendation",
        recommendationTitle: "Our Recommendation: Size",
        tryAgain: "Try again",
        error: "Error",
        errorDesc: "Could not get size recommendation. Please try again."
    },
    ar: {
        sale: "خصم",
        reviews: "تقييمات",
        select: "اختر",
        aiRecommender: "مساعد المقاسات الذكي",
        addToCart: "أضف إلى السلة",
        shippingFeature: "شحن مجاني فوق 50 دولارًا",
        returnsFeature: "إرجاع سهل لمدة 30 يومًا",
        paymentFeature: "مدفوعات آمنة",
        relatedTitle: "قد يعجبك ايضا",
        sizeGuideTitle: "مساعد المقاسات الذكي",
        sizeGuideDesc: "أدخل قياساتك بالسنتيمتر للحصول على توصية مقاس مخصصة.",
        chest: "الصدر (سم)",
        waist: "الخصر (سم)",
        hips: "الأرداف (سم)",
        inseam: "طول الساق (سم)",
        preferredFit: "المقاس المفضل",
        tight: "ضيق",
        regular: "عادي",
        loose: "واسع",
        getRecommendation: "احصل على توصية",
        recommendationTitle: "توصيتنا: مقاس",
        tryAgain: "حاول مرة أخرى",
        error: "خطأ",
        errorDesc: "تعذر الحصول على توصية المقاس. يرجى المحاولة مرة أخرى."
    }
  };

  if (params && !product) {
    notFound();
  }

  if (!product) {
    // You can return a loading skeleton here
    return <div>Loading...</div>;
  }

  const handleVariantChange = (variantKey: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantKey]: value }));
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const onSale = product.originalPrice && product.originalPrice > product.price;

  const productImages = product.images.map(imgId => PlaceHolderImages.find(img => img.id === imgId)).filter(Boolean);

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const mockSizeChart = [
    { "size": "XS", "chest_min": 82, "chest_max": 87, "waist_min": 66, "waist_max": 71, "hip_min": 84, "hip_max": 89 },
    { "size": "S", "chest_min": 88, "chest_max": 93, "waist_min": 72, "waist_max": 77, "hip_min": 90, "hip_max": 95 },
    { "size": "M", "chest_min": 94, "chest_max": 99, "waist_min": 78, "waist_max": 83, "hip_min": 96, "hip_max": 101 },
    { "size": "L", "chest_min": 100, "chest_max": 105, "waist_min": 84, "waist_max": 89, "hip_min": 102, "hip_max": 107 },
    { "size": "XL", "chest_min": 106, "chest_max": 111, "waist_min": 90, "waist_max": 95, "hip_min": 108, "hip_max": 113 }
  ];

  const handleSizeGuideSubmit = async (values: SizeGuideFormValues) => {
    setIsRecommending(true);
    setSizeRecommendation(null);
    try {
        const result = await aiSizeGuideRecommendation({
            ...values,
            productCategory: product.category,
            sizeChart: JSON.stringify(mockSizeChart),
        });
        setSizeRecommendation(result);
    } catch (error) {
        console.error("Error getting size recommendation:", error);
        toast({
          variant: "destructive",
          title: t[language].error,
          description: t[language].errorDesc
        })
    } finally {
        setIsRecommending(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
      setIsSizeGuideOpen(open);
      if (!open) {
          form.reset();
          setSizeRecommendation(null);
      }
  }
  
  const showInseam = ['bottoms'].includes(product.category);

  return (
    <div className="container py-12 md:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Product Images */}
        <div className="space-y-4">
          <Carousel className="w-full">
            <CarouselContent>
              {productImages.length > 0 ? (
                  productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                        {image && (
                          <Image
                            src={image.imageUrl}
                            alt={`${product.name} image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority={index === 0}
                            data-ai-hint={image.imageHint}
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))
              ) : (
                <CarouselItem>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        <p>No Image</p>
                    </div>
                </CarouselItem>
              )}
            </CarouselContent>
            {productImages.length > 1 && (
                <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </>
            )}
          </Carousel>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold">{formatCurrency(product.price)}</p>
            {onSale && (
              <p className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.originalPrice!)}
              </p>
            )}
            {onSale && <Badge variant="destructive">{t[language].sale}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    product.rating > i ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviewCount} {t[language].reviews})</span>
          </div>
          
          <p className="text-base text-muted-foreground">{product.description}</p>
          
          <Separator />

          {/* Variant Selection */}
          <div className="space-y-4">
            {Object.entries(product.variants).map(([key, values]) => (
              <div key={key} className="space-y-2">
                <Label className="text-base font-medium">{t[language].select} {key}</Label>
                <RadioGroup
                  value={selectedVariants[key]}
                  onValueChange={(value) => handleVariantChange(key, value)}
                  className="flex flex-wrap gap-2"
                >
                  {values.map(value => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`${key}-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`${key}-${value}`}
                        className="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
          
           <Dialog open={isSizeGuideOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Ruler className="mr-2 h-4 w-4" />
                    {t[language].aiRecommender}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t[language].sizeGuideTitle}</DialogTitle>
                    <DialogDescription>
                        {t[language].sizeGuideDesc}
                    </DialogDescription>
                </DialogHeader>
                {!sizeRecommendation ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSizeGuideSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="chestMeasurementCm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t[language].chest}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 92" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="waistMeasurementCm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t[language].waist}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 76" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="hipMeasurementCm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t[language].hips}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 94" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {showInseam && (
                            <FormField
                                control={form.control}
                                name="inseamMeasurementCm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t[language].inseam}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 80" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="preferredFit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t[language].preferredFit}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a fit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="tight">{t[language].tight}</SelectItem>
                                            <SelectItem value="regular">{t[language].regular}</SelectItem>
                                            <SelectItem value="loose">{t[language].loose}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>
                      <DialogFooter>
                          <Button type="submit" disabled={isRecommending}>
                              {isRecommending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t[language].getRecommendation}
                          </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                      <Alert>
                          <AlertTitle className="font-bold text-lg">{t[language].recommendationTitle} {sizeRecommendation.recommendedSize}</AlertTitle>
                          <AlertDescription className="mt-2">
                              {sizeRecommendation.recommendationReasoning}
                          </AlertDescription>
                      </Alert>
                      <DialogFooter>
                          <Button onClick={() => setSizeRecommendation(null)}>{t[language].tryAgain}</Button>
                      </DialogFooter>
                  </div>
                )}
            </DialogContent>
          </Dialog>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center gap-2 rounded-md border">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => addToCart(product, quantity, selectedVariants)}
            >
              {t[language].addToCart}
            </Button>
          </div>

          <Separator />

          {/* Features Section */}
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span>{t[language].shippingFeature}</span>
              </div>
              <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <span>{t[language].returnsFeature}</span>
              </div>
              <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>{t[language].paymentFeature}</span>
              </div>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="mb-8 text-2xl font-bold tracking-tight">{t[language].relatedTitle}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
      )}
    </div>
  );
}
