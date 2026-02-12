'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Package, Calendar, Mail } from "lucide-react";
import { useSettings } from "@/contexts/SettingsProvider";

export default function ReturnsPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: "Returns & Exchanges",
      subtitle: "Simple and hassle-free.",
      policyTitle: "Our Policy",
      policyDesc: "We want you to be completely satisfied with your purchase. If you're not, we're here to help.",
      windowTitle: "30-Day Window",
      windowDesc: "You can return or exchange any item within 30 days of the delivery date.",
      conditionTitle: "Item Condition",
      conditionDesc: "Items must be returned in their original condition: unworn, unwashed, with all tags attached.",
      howToTitle: "How to Start a Return",
      step1Title: "Contact Us",
      step1Desc: "Email us at returns@stylegrove.com with your order number and the item(s) you wish to return.",
      step2Title: "Receive Label",
      step2Desc: "We'll send you a prepaid return shipping label and instructions on how to send your item back.",
      step3Title: "Get Refund or Exchange",
      step3Desc: "Once we receive and inspect your return, we'll process your refund or exchange. Refunds are issued to the original payment method."
    },
    ar: {
      title: "المرتجعات والاستبدال",
      subtitle: "بسيطة وخالية من المتاعب.",
      policyTitle: "سياستنا",
      policyDesc: "نريد أن تكون راضيًا تمامًا عن مشترياتك. إذا لم تكن كذلك، فنحن هنا للمساعدة.",
      windowTitle: "فترة 30 يومًا",
      windowDesc: "يمكنك إرجاع أو استبدال أي منتج في غضون 30 يومًا من تاريخ التسليم.",
      conditionTitle: "حالة المنتج",
      conditionDesc: "يجب إرجاع المنتجات في حالتها الأصلية: غير ملبوسة، وغير مغسولة، مع وجود جميع العلامات الأصلية.",
      howToTitle: "كيف تبدأ عملية الإرجاع",
      step1Title: "اتصل بنا",
      step1Desc: "راسلنا عبر البريد الإلكتروني على returns@stylegrove.com مع رقم طلبك والمنتج (المنتجات) التي ترغب في إرجاعها.",
      step2Title: "استلم ملصق الشحن",
      step2Desc: "سنرسل لك ملصق شحن إرجاع مدفوع مسبقًا وتعليمات حول كيفية إعادة إرسال منتجك.",
      step3Title: "احصل على استرداد أو استبدال",
      step3Desc: "بمجرد استلامنا وفحص مرتجعك، سنقوم بمعالجة المبلغ المسترد أو الاستبدال. يتم إصدار المبالغ المستردة إلى طريقة الدفع الأصلية."
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t[language].policyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>{t[language].policyDesc}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-start gap-4">
                    <Calendar className="h-6 w-6 text-primary mt-1 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-foreground">{t[language].windowTitle}</h3>
                        <p>{t[language].windowDesc}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Package className="h-6 w-6 text-primary mt-1 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-foreground">{t[language].conditionTitle}</h3>
                        <p>{t[language].conditionDesc}</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>{t[language].howToTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">1</div>
                    <div>
                        <h3 className="font-semibold text-foreground">{t[language].step1Title}</h3>
                        <p className="text-muted-foreground">{t[language].step1Desc.replace('returns@stylegrove.com', '')}<a href="mailto:returns@stylegrove.com" className="text-primary hover:underline">returns@stylegrove.com</a></p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">2</div>
                    <div>
                        <h3 className="font-semibold text-foreground">{t[language].step2Title}</h3>
                        <p className="text-muted-foreground">{t[language].step2Desc}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">3</div>
                    <div>
                        <h3 className="font-semibold text-foreground">{t[language].step3Title}</h3>
                        <p className="text-muted-foreground">{t[language].step3Desc}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
