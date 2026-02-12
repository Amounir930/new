'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { products } from '@/lib/data';
import { ProductCard } from '@/components/products/ProductCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ListFilter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/contexts/SettingsProvider';

// Extract unique values for filters from the product data
const allBrands = [...new Set(products.map(p => p.brand))];
const allCategories = [...new Set(products.map(p => p.category))];
const maxPrice = Math.ceil(Math.max(...products.map(p => p.price)));

export default function ShopPage() {
  const { language } = useSettings();
  const [sortOption, setSortOption] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [selectedRating, setSelectedRating] = useState(0);

  const t = {
    en: {
        title: "Shop Collection",
        subtitle: "Find your new favorite pieces from our curated collection.",
        showing: "Showing",
        of: "of",
        products: "products",
        filters: "Filters",
        clearAll: "Clear all",
        category: "Category",
        brand: "Brand",
        price: "Price",
        sortBy: "Sort by",
        newest: "Newest",
        priceAsc: "Price: Low to High",
        priceDesc: "Price: High to Low",
        ratingDesc: "Highest Rated",
        noProducts: "No Products Found",
        noProductsDesc: "Try adjusting your filters to find what you're looking for.",
        clearFilters: "Clear Filters",
    },
    ar: {
        title: "تسوق المجموعة",
        subtitle: "ابحث عن قطعك المفضلة الجديدة من مجموعتنا المنسقة.",
        showing: "عرض",
        of: "من",
        products: "منتجات",
        filters: "الفلاتر",
        clearAll: "مسح الكل",
        category: "الفئة",
        brand: "العلامة التجارية",
        price: "السعر",
        sortBy: "الفرز حسب",
        newest: "الأحدث",
        priceAsc: "السعر: من الأقل إلى الأعلى",
        priceDesc: "السعر: من الأعلى إلى الأقل",
        ratingDesc: "الأعلى تقييماً",
        noProducts: "لم يتم العثور على منتجات",
        noProductsDesc: "حاول تعديل فلاترك للعثور على ما تبحث عنه.",
        clearFilters: "مسح الفلاتر",
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setSelectedRating(0);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);
      const brandMatch =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const priceMatch =
        product.price >= priceRange[0] && product.price <= priceRange[1];
      const ratingMatch = product.rating >= selectedRating;
      return categoryMatch && brandMatch && priceMatch && ratingMatch;
    });

    switch (sortOption) {
      case 'price-asc':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'newest':
      default:
        // Assuming products are already sorted by newness or we can use id as a proxy
        return filtered.sort((a, b) => (b.id > a.id ? 1 : -1));
    }
  }, [sortOption, selectedCategories, selectedBrands, priceRange, selectedRating]);
  
  const hasActiveFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || priceRange[0] !== 0 || priceRange[1] !== maxPrice || selectedRating > 0;

  const Filters = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t[language].filters}</h3>
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    {t[language].clearAll}
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      <Accordion type="multiple" defaultValue={['category', 'brand', 'price']} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-medium">{t[language].category}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-2">
              {allCategories.map(category => (
                <div key={category} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryChange(category)}
                  />
                  <label htmlFor={`cat-${category}`} className="cursor-pointer text-sm font-normal capitalize">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="brand">
          <AccordionTrigger className="text-base font-medium">{t[language].brand}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-2">
              {allBrands.map(brand => (
                <div key={brand} className="flex items-center gap-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => handleBrandChange(brand)}
                  />
                  <label htmlFor={`brand-${brand}`} className="cursor-pointer text-sm font-normal">
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-medium">{t[language].price}</AccordionTrigger>
          <AccordionContent>
             <div className="p-1">
                <Slider
                    min={0}
                    max={maxPrice}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value)}
                />
                <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                </div>
             </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="flex items-start gap-8 lg:gap-12">
        {/* Desktop Filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Filters />
        </aside>

        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t[language].showing} {filteredAndSortedProducts.length} {t[language].of} {products.length} {t[language].products}
            </p>
            <div className="flex items-center gap-4">
              {/* Mobile Filters Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                        <ListFilter className="h-4 w-4"/>
                        <span className="sr-only">{t[language].filters}</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-sm p-0">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                            <Filters />
                        </div>
                    </ScrollArea>
                </SheetContent>
              </Sheet>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t[language].sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t[language].newest}</SelectItem>
                  <SelectItem value="price-asc">{t[language].priceAsc}</SelectItem>
                  <SelectItem value="price-desc">{t[language].priceDesc}</SelectItem>
                  <SelectItem value="rating-desc">{t[language].ratingDesc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
            {filteredAndSortedProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <h3 className="text-2xl font-semibold">{t[language].noProducts}</h3>
                    <p className="mt-2 text-muted-foreground">
                       {t[language].noProductsDesc}
                    </p>
                    <Button onClick={clearFilters} className="mt-4">
                        {t[language].clearFilters}
                    </Button>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
