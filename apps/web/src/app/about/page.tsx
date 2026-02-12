'use client';
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Users, Target, Eye } from "lucide-react";
import { useSettings } from "@/contexts/SettingsProvider";

export default function AboutUsPage() {
  const aboutImage = PlaceHolderImages.find(img => img.id === 'hero-1');
  const { language } = useSettings();

  const t = {
    en: {
      title: "About StyleGrove",
      subtitle: "Fashion for the modern world.",
      ourStory: "Our Story",
      story1: "Founded in 2024, StyleGrove was born from a passion for making high-quality, sustainable fashion accessible to everyone. We believe that style should not only look good but also feel good and do good. Our journey started with a small collection of curated pieces and has grown into a global community of fashion lovers who share our values.",
      story2: "We are dedicated to sourcing the best materials, partnering with ethical manufacturers, and designing timeless pieces that you'll cherish for years to come.",
      ourVision: "Our Vision",
      visionText: "To be the leading global destination for conscious consumers seeking stylish, high-quality, and sustainable fashion.",
      ourMission: "Our Mission",
      missionText: "To empower individuals to express their unique style through thoughtfully designed apparel that makes a positive impact on the world.",
      ourValues: "Our Values",
      valuesText: "Sustainability, Quality, Transparency, and Community. These pillars guide every decision we make, from design to delivery.",
      imageAlt: "Team at StyleGrove"
    },
    ar: {
      title: "عن ستايل جروف",
      subtitle: "أزياء للعالم الحديث.",
      ourStory: "قصتنا",
      story1: "تأسست ستايل جروف في عام 2024 من شغف لجعل الأزياء عالية الجودة والمستدامة في متناول الجميع. نؤمن بأن الأناقة لا يجب أن تبدو جيدة فحسب، بل يجب أن تشعرك بالرضا وتفعل الخير. بدأت رحلتنا بمجموعة صغيرة من القطع المنتقاة ونمت لتصبح مجتمعًا عالميًا من محبي الموضة الذين يشاركوننا قيمنا.",
      story2: "نحن ملتزمون بالحصول على أفضل المواد، والشراكة مع المصنعين الأخلاقيين، وتصميم قطع خالدة ستعتز بها لسنوات قادمة.",
      ourVision: "رؤيتنا",
      visionText: "أن نكون الوجهة العالمية الرائدة للمستهلكين الواعين الذين يبحثون عن أزياء أنيقة وعالية الجودة ومستدامة.",
      ourMission: "مهمتنا",
      missionText: "تمكين الأفراد من التعبير عن أسلوبهم الفريد من خلال ملابس مصممة بعناية وتحدث تأثيرًا إيجابيًا في العالم.",
      ourValues: "قيمنا",
      valuesText: "الاستدامة، الجودة، الشفافية، والمجتمع. هذه الركائز توجه كل قرار نتخذه، من التصميم إلى التسليم.",
      imageAlt: "فريق العمل في ستايل جروف"
    }
  }

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            {aboutImage && (
                <Image
                    src={aboutImage.imageUrl}
                    alt={t[language].imageAlt}
                    fill
                    className="object-cover"
                    data-ai-hint="team work"
                />
            )}
        </div>
        <div className="flex flex-col justify-center space-y-6">
            <h2 className="text-3xl font-bold">{t[language].ourStory}</h2>
            <p className="text-muted-foreground">
                {t[language].story1}
            </p>
            <p className="text-muted-foreground">
                {t[language].story2}
            </p>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:mt-24">
        <div className="flex flex-col items-center text-center">
            <Eye className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold">{t[language].ourVision}</h3>
            <p className="mt-2 text-muted-foreground">{t[language].visionText}</p>
        </div>
        <div className="flex flex-col items-center text-center">
            <Target className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold">{t[language].ourMission}</h3>
            <p className="mt-2 text-muted-foreground">{t[language].missionText}</p>
        </div>
        <div className="flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold">{t[language].ourValues}</h3>
            <p className="mt-2 text-muted-foreground">{t[language].valuesText}</p>
        </div>
      </div>
    </div>
  );
}
