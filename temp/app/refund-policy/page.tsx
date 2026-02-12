'use client';
import { Banknote, Clock, PackageCheck } from "lucide-react";
import { useSettings } from "@/contexts/SettingsProvider";

export default function RefundPolicyPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: "Refund Policy",
      subtitle: "Clear and simple refunds.",
      eligibilityTitle: "Eligibility for a Refund",
      eligibilityDesc: "To be eligible for a refund, your item must be returned within 30 days of purchase in the same condition that you received it: unworn, unwashed, and with all original tags attached.",
      processingTitle: "Processing Time",
      processingDesc: "Once we receive your returned item, we will inspect it and notify you of the status of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.",
      nonRefundableTitle: "Non-Refundable Items",
      nonRefundableDesc: "Gift cards and items marked as \"Final Sale\" are not eligible for refunds. Shipping costs are also non-refundable."
    },
    ar: {
      title: "سياسة الاسترداد",
      subtitle: "استردادات واضحة وبسيطة.",
      eligibilityTitle: "الأهلية للاسترداد",
      eligibilityDesc: "لكي تكون مؤهلاً للاسترداد، يجب إرجاع المنتج في غضون 30 يومًا من الشراء بنفس الحالة التي استلمته بها: غير ملبوس، وغير مغسول، مع وجود جميع العلامات الأصلية.",
      processingTitle: "وقت المعالجة",
      processingDesc: "بمجرد استلامنا للمنتج المرتجع، سنقوم بفحصه وإعلامك بحالة استردادك. إذا تمت الموافقة، ستتم معالجة المبلغ المسترد، وسيتم تطبيق رصيد تلقائيًا على طريقة الدفع الأصلية في غضون 5-7 أيام عمل.",
      nonRefundableTitle: "المنتجات غير القابلة للاسترداد",
      nonRefundableDesc: "بطاقات الهدايا والمنتجات التي تحمل علامة \"بيع نهائي\" غير مؤهلة للاسترداد. تكاليف الشحن غير قابلة للاسترداد أيضًا."
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t[language].subtitle}</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-6">
            <div className="flex items-start gap-4 rounded-lg border p-6">
                <PackageCheck className="h-8 w-8 text-primary mt-1 shrink-0" />
                <div>
                    <h2 className="mt-0">{t[language].eligibilityTitle}</h2>
                    <p className="text-muted-foreground">{t[language].eligibilityDesc}</p>
                </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-6">
                <Clock className="h-8 w-8 text-primary mt-1 shrink-0" />
                <div>
                    <h2 className="mt-0">{t[language].processingTitle}</h2>
                    <p className="text-muted-foreground">{t[language].processingDesc}</p>
                </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-6">
                <Banknote className="h-8 w-8 text-primary mt-1 shrink-0" />
                <div>
                    <h2 className="mt-0">{t[language].nonRefundableTitle}</h2>
                    <p className="text-muted-foreground">{t[language].nonRefundableDesc}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
