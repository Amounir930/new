'use client';
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { blogPosts } from "@/lib/data";
import { useSettings } from "@/contexts/SettingsProvider";

export default function BlogPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: "StyleGrove Blog",
      subtitle: "Your daily dose of fashion news, trends, and inspiration.",
      readMore: "Read More",
      trends: "Trends",
      sustainability: "Sustainability",
      styleGuides: "Style Guides"
    },
    ar: {
      title: "مدونة ستايل جروف",
      subtitle: "جرعتك اليومية من أخبار الموضة والاتجاهات والإلهام.",
      readMore: "اقرأ المزيد",
      trends: "اتجاهات",
      sustainability: "الاستدامة",
      styleGuides: "أدلة الأناقة"
    }
  };

  const getCategoryTranslation = (category: string) => {
    if (language === 'ar') {
      switch(category) {
        case 'Trends': return t.ar.trends;
        case 'Sustainability': return t.ar.sustainability;
        case 'Style Guides': return t.ar.styleGuides;
      }
    }
    return category;
  }

  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => {
            const image = PlaceHolderImages.find(img => img.id === post.imageId);
            return (
          <Card key={post.id} className="flex flex-col overflow-hidden">
            {image && (
                <div className="relative aspect-video w-full">
                <Image
                    src={image.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                />
                </div>
            )}
            <CardHeader>
                <Badge variant="secondary" className="w-fit">{getCategoryTranslation(post.category)}</Badge>
                <CardTitle className="mt-2 text-xl">{post.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{post.excerpt}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{post.date}</span>
                 <Link href={`/blog/${post.slug}`} className="flex items-center text-primary hover:underline">
                    {t[language].readMore} <Arrow className="ms-2 h-4 w-4" />
                </Link>
            </CardFooter>
          </Card>
        )})}
      </div>
    </div>
  );
}
