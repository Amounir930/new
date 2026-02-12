'use client';
import { useSettings } from '@/contexts/SettingsProvider';

export default function PrivacyPolicyPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: July 26, 2024',
      welcome:
        'Welcome to StyleGrove! We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.',
      h2_1: 'Information We Collect',
      p2_1: 'We may collect personal information from you such as your name, email address, postal address, phone number, and payment information when you make a purchase, create an account, or subscribe to our newsletter.',
      h2_2: 'How We Use Your Information',
      p2_2: 'We use the information we collect to:',
      li2_1: 'Process your transactions and manage your orders.',
      li2_2: 'Send you promotional materials and newsletters.',
      li2_3: 'Improve our website and customer service.',
      li2_4: 'Respond to your comments, questions, and requests.',
      h2_3: 'Sharing Your Information',
      p2_3: 'We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.',
      h2_4: 'Security of Your Information',
      p2_4: 'We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.',
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 26 يوليو 2024',
      welcome:
        'مرحبًا بك في ستايل جروف! نحن ملتزمون بحماية خصوصيتك. تشرح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونكشف عنها ونحميها عند زيارتك لموقعنا.',
      h2_1: 'المعلومات التي نجمعها',
      p2_1: 'قد نجمع معلومات شخصية منك مثل اسمك وعنوان بريدك الإلكتروني وعنوانك البريدي ورقم هاتفك ومعلومات الدفع عند إجراء عملية شراء أو إنشاء حساب أو الاشتراك في نشرتنا الإخبارية.',
      h2_2: 'كيف نستخدم معلوماتك',
      p2_2: 'نستخدم المعلومات التي نجمعها من أجل:',
      li2_1: 'معالجة معاملاتك وإدارة طلباتك.',
      li2_2: 'إرسال المواد الترويجية والنشرات الإخبارية إليك.',
      li2_3: 'تحسين موقعنا وخدمة العملاء.',
      li2_4: 'الرد على تعليقاتك وأسئلتك وطلباتك.',
      h2_3: 'مشاركة معلوماتك',
      p2_3: 'نحن لا نبيع معلوماتك الشخصية أو نتاجر بها أو ننقلها إلى أطراف خارجية ما لم نوفر للمستخدمين إشعارًا مسبقًا. لا يشمل ذلك شركاء استضافة مواقع الويب والأطراف الأخرى التي تساعدنا في تشغيل موقعنا أو إدارة أعمالنا أو خدمة مستخدمينا، طالما وافقت تلك الأطراف على الحفاظ على سرية هذه المعلومات.',
      h2_4: 'أمن معلوماتك',
      p2_4: 'نحن نستخدم تدابير أمنية إدارية وتقنية ومادية للمساعدة في حماية معلوماتك الشخصية. على الرغم من أننا اتخذنا خطوات معقولة لتأمين المعلومات الشخصية التي تقدمها لنا، يرجى العلم أنه على الرغم من جهودنا، لا توجد تدابير أمنية مثالية أو لا يمكن اختراقها.',
    },
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            {t[language].title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t[language].lastUpdated}
          </p>
        </header>
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p>{t[language].welcome}</p>

          <h2>{t[language].h2_1}</h2>
          <p>{t[language].p2_1}</p>

          <h2>{t[language].h2_2}</h2>
          <p>{t[language].p2_2}</p>
          <ul>
            <li>{t[language].li2_1}</li>
            <li>{t[language].li2_2}</li>
            <li>{t[language].li2_3}</li>
            <li>{t[language].li2_4}</li>
          </ul>

          <h2>{t[language].h2_3}</h2>
          <p>{t[language].p2_3}</p>

          <h2>{t[language].h2_4}</h2>
          <p>{t[language].p2_4}</p>
        </div>
      </div>
    </div>
  );
}
