'use client';
import { useSettings } from "@/contexts/SettingsProvider";

export default function TermsOfServicePage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: July 26, 2024",
      h1: "1. Agreement to Terms",
      p1: "By using our website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.",
      h2: "2. Use of the Website",
      p2: "You agree to use the website for lawful purposes only. You are prohibited from posting on or transmitting through the site any material that is unlawful, harmful, or otherwise objectionable.",
      h3: "3. Intellectual Property",
      p3: "All content on this website, including text, graphics, logos, and images, is the property of StyleGrove or its content suppliers and is protected by international copyright laws.",
      h4: "4. Limitation of Liability",
      p4: "StyleGrove will not be liable for any damages of any kind arising from the use of this site, including, but not limited to direct, indirect, incidental, punitive, and consequential damages.",
      h5: "5. Governing Law",
      p5: "These terms are governed by the laws of the State of New York, without regard to its conflict of law principles."
    },
    ar: {
      title: "شروط الخدمة",
      lastUpdated: "آخر تحديث: 26 يوليو 2024",
      h1: "1. الموافقة على الشروط",
      p1: "باستخدام موقعنا، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام موقعنا.",
      h2: "2. استخدام الموقع",
      p2: "أنت توافق على استخدام الموقع لأغراض مشروعة فقط. يحظر عليك نشر أو نقل أي مواد غير قانونية أو ضارة أو مرفوضة بأي شكل آخر عبر الموقع.",
      h3: "3. الملكية الفكرية",
      p3: "جميع المحتويات على هذا الموقع، بما في ذلك النصوص والرسومات والشعارات والصور، هي ملك لشركة StyleGrove أو موردي المحتوى التابعين لها وهي محمية بموجب قوانين حقوق النشر الدولية.",
      h4: "4. تحديد المسؤولية",
      p4: "لن تكون StyleGrove مسؤولة عن أي أضرار من أي نوع تنشأ عن استخدام هذا الموقع، بما في ذلك، على سبيل المثال لا الحصر، الأضرار المباشرة وغير المباشرة والعرضية والعقابية والتبعية.",
      h5: "5. القانون الحاكم",
      p5: "تخضع هذه الشروط لقوانين ولاية نيويورك، بغض النظر عن تعارضها مع مبادئ القانون."
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t[language].lastUpdated}</p>
        </header>
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h2>{t[language].h1}</h2>
          <p>
            {t[language].p1}
          </p>

          <h2>{t[language].h2}</h2>
          <p>
            {t[language].p2}
          </p>
          
          <h2>{t[language].h3}</h2>
          <p>
            {t[language].p3}
          </p>

          <h2>{t[language].h4}</h2>
          <p>
            {t[language].p4}
          </p>

          <h2>{t[language].h5}</h2>
          <p>
            {t[language].p5}
          </p>
        </div>
      </div>
    </div>
  );
}
