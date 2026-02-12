'use client';

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsProvider";

export default function CheckoutPage() {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useSettings();
    const cartTotal = getCartTotal();
    const shippingCost = cartTotal > 0 ? 5.00 : 0;
    const tax = cartTotal * 0.08; // 8% tax
    const total = cartTotal + shippingCost + tax;

    const t = {
        en: {
            orderPlaced: "Order Placed!",
            orderPlacedDesc: "Thank you for your purchase. Your order is being processed.",
            emptyCartTitle: "Your cart is empty",
            emptyCartDesc: "You can't checkout without any items.",
            startShopping: "Start Shopping",
            checkout: "Checkout",
            shippingInfo: "Shipping Information",
            firstName: "First Name",
            lastName: "Last Name",
            address: "Address",
            city: "City",
            state: "State",
            zip: "ZIP Code",
            paymentDetails: "Payment Details",
            cardName: "Name on Card",
            cardNumber: "Card Number",
            expiry: "Expiry Date",
            cvc: "CVC",
            orderSummary: "Order Summary",
            quantity: "Qty",
            subtotal: "Subtotal",
            shipping: "Shipping",
            taxes: "Taxes",
            total: "Total",
            placeOrder: "Place Order"
        },
        ar: {
            orderPlaced: "تم تقديم الطلب!",
            orderPlacedDesc: "شكرا لك على الشراء. طلبك قيد المعالجة.",
            emptyCartTitle: "سلتك فارغة",
            emptyCartDesc: "لا يمكنك الدفع بدون أي منتجات.",
            startShopping: "ابدأ التسوق",
            checkout: "الدفع",
            shippingInfo: "معلومات الشحن",
            firstName: "الاسم الأول",
            lastName: "الاسم الأخير",
            address: "العنوان",
            city: "المدينة",
            state: "الولاية",
            zip: "الرمز البريدي",
            paymentDetails: "تفاصيل الدفع",
            cardName: "الاسم على البطاقة",
            cardNumber: "رقم البطاقة",
            expiry: "تاريخ انتهاء الصلاحية",
            cvc: "CVC",
            orderSummary: "ملخص الطلب",
            quantity: "الكمية",
            subtotal: "المجموع الفرعي",
            shipping: "الشحن",
            taxes: "الضرائب",
            total: "الإجمالي",
            placeOrder: "إتمام الطلب"
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would process the payment here.
        toast({
            title: t[language].orderPlaced,
            description: t[language].orderPlacedDesc,
        });
        clearCart();
        router.push('/thank-you'); // Redirect to a thank you page
    }
    
    if (cartItems.length === 0) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-semibold">{t[language].emptyCartTitle}</h2>
                <p className="text-muted-foreground">{t[language].emptyCartDesc}</p>
                <Button asChild>
                    <Link href="/shop">{t[language].startShopping}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container py-12 md:py-16">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight">{t[language].checkout}</h1>
            </header>
            <form onSubmit={handlePlaceOrder}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Customer Info & Payment */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t[language].shippingInfo}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">{t[language].firstName}</Label>
                                    <Input id="firstName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">{t[language].lastName}</Label>
                                    <Input id="lastName" required />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">{t[language].address}</Label>
                                    <Input id="address" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">{t[language].city}</Label>
                                    <Input id="city" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">{t[language].state}</Label>
                                    <Input id="state" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip">{t[language].zip}</Label>
                                    <Input id="zip" required />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t[language].paymentDetails}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="space-y-2">
                                    <Label htmlFor="cardName">{t[language].cardName}</Label>
                                    <Input id="cardName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">{t[language].cardNumber}</Label>
                                    <Input id="cardNumber" placeholder=".... .... .... ...." required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">{t[language].expiry}</Label>
                                        <Input id="expiry" placeholder="MM/YY" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvc">{t[language].cvc}</Label>
                                        <Input id="cvc" placeholder="123" required />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t[language].orderSummary}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cartItems.map(item => {
                                    const image = PlaceHolderImages.find(img => img.id === item.product.images[0]);
                                    return (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                                {image && <Image src={image.imageUrl} alt={item.product.name} fill className="object-cover" data-ai-hint={image.imageHint} />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-medium">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">{t[language].quantity}: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">{formatCurrency(item.product.price * item.quantity)}</p>
                                        </div>
                                    )
                                })}
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>{t[language].subtotal}</span>
                                        <span>{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t[language].shipping}</span>
                                        <span>{formatCurrency(shippingCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t[language].taxes}</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t[language].total}</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" size="lg" className="w-full">
                                    {t[language].placeOrder}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
