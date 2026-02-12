'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/contexts/SettingsProvider";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function FaqPage() {
  const { language } = useSettings();

  const t = {
    en: {
        title: "Frequently Asked Questions",
        subtitle: "Find answers to common questions below.",
        q1: "What is your return policy?",
        a1: "We offer a 30-day return policy for all items that are unworn, unwashed, and have the original tags attached. For more details, please visit our [Refund Policy](/refund-policy) page.",
        q2: "How can I track my order?",
        a2: "Once your order has shipped, you will receive an email with a tracking number. You can use this number on our [Track Order](/track-order) page to see the status of your delivery.",
        q3: "What payment methods do you accept?",
        a3: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and several Buy Now, Pay Later options. All payments are processed securely.",
        q4: "How long does shipping take?",
        a4: "Standard shipping typically takes 3-5 business days. We also offer express shipping options at checkout for faster delivery.",
        q5: "Do you ship internationally?",
        a5: "Yes, we ship to over 50 countries worldwide. International shipping rates and times vary by destination and will be calculated at checkout.",
        q6: "How do I use a discount code?",
        a6: "You can enter your discount code in the designated field during the checkout process. The discount will be applied to your order total.",
        stillHaveQuestions: "Still have questions?",
        supportTeam: "Our support team is here to help.",
        contactUs: "Contact Us",
    },
    ar: {
        title: "الأسئلة الشائعة",
        subtitle: "ابحث عن إجابات للأسئلة الشائعة أدناه.",
        q1: "ما هي سياسة الإرجاع الخاصة بكم؟",
        a1: "نحن نقدم سياسة إرجاع لمدة 30 يومًا لجميع المنتجات غير الملبوسة وغير المغسولة والتي تحمل العلامات الأصلية. لمزيد من التفاصيل، يرجى زيارة صفحة [سياسة الاسترداد](/refund-policy).",
        q2: "كيف يمكنني تتبع طلبي؟",
        a2: "بمجرد شحن طلبك، ستتلقى رسالة بريد إلكتروني تحتوي على رقم تتبع. يمكنك استخدام هذا الرقم في صفحة [تتبع الطلب](/track-order) لمعرفة حالة التسليم.",
        q3: "ما هي طرق الدفع التي تقبلونها؟",
        a3: "نحن نقبل جميع بطاقات الائتمان الرئيسية (Visa ، MasterCard ، American Express) ، و PayPal ، والعديد من خيارات الشراء الآن والدفع لاحقًا. تتم معالجة جميع المدفوعات بشكل آمن.",
        q4: "كم من الوقت يستغرق الشحن؟",
        a4: "يستغرق الشحن القياسي عادةً من 3 إلى 5 أيام عمل. كما نقدم خيارات شحن سريعة عند الدفع لتسليم أسرع.",
        q5: "هل تشحنون دوليًا؟",
        a5: "نعم، نحن نشحن إلى أكثر من 50 دولة حول العالم. تختلف أسعار وأوقات الشحن الدولي حسب الوجهة وسيتم احتسابها عند الدفع.",
        q6: "كيف أستخدم رمز الخصم؟",
        a6: "يمكنك إدخال رمز الخصم الخاص بك في الحقل المخصص أثناء عملية الدفع. سيتم تطبيق الخصم على إجمالي طلبك.",
        stillHaveQuestions: "هل ما زلت لديك أسئلة؟",
        supportTeam: "فريق الدعم لدينا هنا للمساعدة.",
        contactUs: "اتصل بنا",
    }
  };

  const faqItems = [
    { question: t[language].q1, answer: t[language].a1 },
    { question: t[language].q2, answer: t[language].a2 },
    { question: t[language].q3, answer: t[language].a3 },
    { question: t[language].q4, answer: t[language].a4 },
    { question: t[language].q5, answer: t[language].a5 },
    { question: t[language].q6, answer: t[language].a6 },
  ];

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                       {item.answer.includes('[') ? (
                           <>
                            {item.answer.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                const match = /\[(.*?)\]\((.*?)\)/.exec(part);
                                if (match) {
                                    return <Link key={i} href={match[2]} className="text-primary hover:underline">{match[1]}</Link>;
                                }
                                return part;
                            })}
                           </>
                       ) : item.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </div>

       <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold">{t[language].stillHaveQuestions}</h2>
            <p className="mt-2 text-muted-foreground">
                {t[language].supportTeam}
            </p>
            <Link href="/contact" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                <Mail className="mr-2 h-5 w-5" />
                {t[language].contactUs}
            </Link>
       </div>

    </div>
  );
}
