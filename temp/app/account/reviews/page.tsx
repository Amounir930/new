'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsProvider";

const mockReviews = [
    { id: 1, productName: 'Classic Denim Jacket', rating: 5, date: '2024-07-22', review: 'Absolutely love this jacket! The fit is perfect and the quality is amazing. A staple in my wardrobe now.' },
    { id: 2, productName: 'Organic Cotton T-Shirt', rating: 4, date: '2024-07-18', review: 'Super soft and comfortable. I wish it came in more colors, but the white is a classic. Great value.' },
];

const mockReviewsAr = [
    { id: 1, productName: 'جاكيت جينز كلاسيك', rating: 5, date: '2024-07-22', review: 'أحب هذا الجاكيت تمامًا! المقاس مثالي والجودة مذهلة. قطعة أساسية في خزانة ملابسي الآن.' },
    { id: 2, productName: 'تي شيرت قطن عضوي', rating: 4, date: '2024-07-18', review: 'ناعم ومريح للغاية. أتمنى لو كان متوفرًا بألوان أكثر، لكن اللون الأبيض كلاسيكي. قيمة رائعة.' },
];

export default function MyReviewsPage() {
    const { language } = useSettings();
    const t = {
        en: {
            title: "My Reviews",
            noReviews: "You haven't written any reviews yet",
            noReviewsDesc: "Share your thoughts on products you've purchased.",
            viewOrders: "View Your Orders"
        },
        ar: {
            title: "تقييماتي",
            noReviews: "لم تكتب أي تقييمات بعد",
            noReviewsDesc: "شارك بآرائك حول المنتجات التي اشتريتها.",
            viewOrders: "عرض طلباتك"
        }
    };
    
    const reviews = language === 'ar' ? mockReviewsAr : mockReviews;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t[language].title}</CardTitle>
            </CardHeader>
            <CardContent>
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{review.productName}</h3>
                                        <div className="flex items-center mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                key={i}
                                                className={`h-4 w-4 ${
                                                    review.rating > i ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                                }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{review.date}</span>
                                </div>
                                <p className="mt-2 text-muted-foreground">{review.review}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold">{t[language].noReviews}</h3>
                        <p className="text-muted-foreground mt-2">{t[language].noReviewsDesc}</p>
                        <Button asChild className="mt-4">
                            <Link href="/account/orders">{t[language].viewOrders}</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
