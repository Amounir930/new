'use client';
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsProvider";

export default function OrderFailedPage() {
    const { language } = useSettings();
    const t = {
        en: {
            title: "Payment Failed",
            subtitle: "Unfortunately, we couldn't process your payment.",
            description: "Please check your payment details and try again, or use a different payment method.",
            tryAgain: "Try Again",
            contactSupport: "Contact Support"
        },
        ar: {
            title: "فشل الدفع",
            subtitle: "للأسف، لم نتمكن من معالجة دفعتك.",
            description: "يرجى التحقق من تفاصيل الدفع والمحاولة مرة أخرى، أو استخدام طريقة دفع مختلفة.",
            tryAgain: "حاول مرة أخرى",
            contactSupport: "اتصل بالدعم"
        }
    };

    return (
        <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
            <XCircle className="h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">{t[language].title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{t[language].subtitle}</p>
            <p className="mt-1 text-muted-foreground">{t[language].description}</p>
            <div className="mt-6 flex gap-4">
                <Button asChild>
                    <Link href="/checkout">{t[language].tryAgain}</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/contact">{t[language].contactSupport}</Link>
                </Button>
            </div>
        </div>
    )
}
