'use client';
import { products } from "@/lib/data";
import { useSettings } from "@/contexts/SettingsProvider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Star, Shapes } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for which products to compare. In a real app, this would be managed by user state.
const productsToCompare = products.slice(0, 3);

export default function ComparePage() {
    const { language } = useSettings();

    const t = {
        en: {
            title: "Compare Products",
            subtitle: "Side-by-side comparison of your selected items.",
            noProductsTitle: "Nothing to Compare",
            noProductsDesc: "Add products to your comparison list to see them here.",
            browseProducts: "Browse Products",
            image: "Image",
            name: "Name",
            price: "Price",
            rating: "Rating",
            brand: "Brand",
            category: "Category",
            reviews: "reviews",
            addToCart: "Add to Cart",
        },
        ar: {
            title: "مقارنة المنتجات",
            subtitle: "مقارنة جنبًا إلى جنب للمنتجات التي اخترتها.",
            noProductsTitle: "لا يوجد شيء للمقارنة",
            noProductsDesc: "أضف منتجات إلى قائمة المقارنة الخاصة بك لرؤيتها هنا.",
            browseProducts: "تصفح المنتجات",
            image: "الصورة",
            name: "الاسم",
            price: "السعر",
            rating: "التقييم",
            brand: "العلامة التجارية",
            category: "الفئة",
            reviews: "تقييمات",
            addToCart: "أضف إلى السلة",
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    if (productsToCompare.length === 0) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <Shapes className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">{t[language].noProductsTitle}</h2>
                <p className="text-muted-foreground">{t[language].noProductsDesc}</p>
                <Button asChild className="mt-4">
                    <Link href="/shop">{t[language].browseProducts}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container py-12 md:py-16">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{t[language].subtitle}</p>
            </header>

            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-48 font-semibold">{/* Attribute Name */}</TableHead>
                            {productsToCompare.map(product => (
                                <TableHead key={product.id} className="w-1/3 min-w-64">
                                     <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                                        {(() => {
                                            const image = PlaceHolderImages.find(img => img.id === product.images[0]);
                                            return image ? <Image src={image.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={image.imageHint} /> : null;
                                        })()}
                                     </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-semibold">{t[language].name}</TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id}>
                                    <Link href={`/shop/product/${product.slug}`} className="font-bold hover:underline">{product.name}</Link>
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">{t[language].price}</TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id} className="font-semibold">
                                    <div className="flex flex-col">
                                        <span>{formatCurrency(product.price)}</span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</span>
                                        )}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">{t[language].rating}</TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                             {[...Array(5)].map((_, i) => (
                                                <Star
                                                key={i}
                                                className={`h-4 w-4 ${
                                                    product.rating > i ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                                }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-semibold">{t[language].brand}</TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id}>{product.brand}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">{t[language].category}</TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id} className="capitalize">{product.category}</TableCell>
                            ))}
                        </TableRow>
                         <TableRow>
                            <TableCell></TableCell>
                            {productsToCompare.map(product => (
                                <TableCell key={product.id}>
                                    <Button className="w-full">{t[language].addToCart}</Button>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
