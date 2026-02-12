"use client";

import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsProvider";

export function CartSheet() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { language } = useSettings();
  const cartTotal = getCartTotal();
  const shippingCost = cartItems.length > 0 ? 5.00 : 0;

  const t = {
    en: {
      title: "Shopping Cart",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      checkout: "Proceed to Checkout",
      emptyTitle: "Your cart is empty",
      emptyDesc: "Looks like you haven't added anything yet.",
      startShopping: "Start Shopping"
    },
    ar: {
      title: "سلة التسوق",
      subtotal: "المجموع الفرعي",
      shipping: "الشحن",
      total: "الإجمالي",
      checkout: "المتابعة للدفع",
      emptyTitle: "سلتك فارغة",
      emptyDesc: "يبدو أنك لم تضف أي شيء بعد.",
      startShopping: "ابدأ التسوق"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <SheetContent className="flex w-full flex-col sm:max-w-md">
      <SheetHeader>
        <SheetTitle>{t[language].title}</SheetTitle>
      </SheetHeader>
      <Separator />
      {cartItems.length > 0 ? (
        <>
          <ScrollArea className="-mr-4 flex-grow pr-4">
            <div className="flex flex-col gap-4 py-4">
              {cartItems.map((item) => {
                const image = PlaceHolderImages.find(img => img.id === item.product.images[0]);
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md shrink-0">
                      {image && (
                        <Image
                          src={image.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          data-ai-hint={image.imageHint}
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <Link href={`/shop/product/${item.product.slug}`} className="font-medium hover:underline">
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {Object.entries(item.variant).map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="h-8 w-16 text-center"
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="self-start shrink-0" onClick={() => removeFromCart(item.id)}>
                      <X className="h-4 w-4"/>
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="flex flex-col gap-4 pt-6">
            <div className="flex justify-between">
              <span>{t[language].subtotal}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t[language].shipping}</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>{t[language].total}</span>
              <span>{formatCurrency(cartTotal + shippingCost)}</span>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">{t[language].checkout}</Link>
            </Button>
          </SheetFooter>
        </>
      ) : (
        <div className="flex flex-grow flex-col items-center justify-center gap-4 text-center">
            <h3 className="text-xl font-semibold">{t[language].emptyTitle}</h3>
            <p className="text-muted-foreground">{t[language].emptyDesc}</p>
            <Button asChild>
                <Link href="/shop">{t[language].startShopping}</Link>
            </Button>
        </div>
      )}
    </SheetContent>
  );
}
