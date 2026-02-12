'use client';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { blogPosts } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { User, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/contexts/SettingsProvider';
import { useMemo } from 'react';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const post = useMemo(
    () => blogPosts.find((p) => p.slug === params?.slug),
    [params?.slug]
  );
  const { language } = useSettings();

  const t = {
    en: {
      backToBlog: 'Back to Blog',
      relatedPosts: 'Related Posts',
      trends: 'Trends',
      sustainability: 'Sustainability',
      styleGuides: 'Style Guides',
    },
    ar: {
      backToBlog: 'العودة إلى المدونة',
      relatedPosts: 'مقالات ذات صلة',
      trends: 'اتجاهات',
      sustainability: 'الاستدامة',
      styleGuides: 'أدلة الأناقة',
    },
  };

  if (params && !post) {
    notFound();
  }

  if (!post) {
    return <div>Loading...</div>;
  }

  const postImage = PlaceHolderImages.find((img) => img.id === post.imageId);
  const relatedPosts = blogPosts
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 2);

  const getCategoryTranslation = (category: string) => {
    if (language === 'ar') {
      switch (category) {
        case 'Trends':
          return t.ar.trends;
        case 'Sustainability':
          return t.ar.sustainability;
        case 'Style Guides':
          return t.ar.styleGuides;
      }
    }
    return category;
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Button asChild variant="ghost" className="mb-4 -ms-4">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t[language].backToBlog}
            </Link>
          </Button>
          <Badge variant="secondary" className="mb-2">
            {getCategoryTranslation(post.category)}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{post.date}</span>
            </div>
          </div>
        </header>

        {postImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-8">
            <Image
              src={postImage.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
              data-ai-hint={postImage.imageHint || 'blog post image'}
            />
          </div>
        )}

        <article className="prose prose-lg max-w-none dark:prose-invert">
          <p className="lead">{post.excerpt}</p>
          <p>{post.content}</p>
        </article>

        <Separator className="my-12" />

        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              {t[language].relatedPosts}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => {
                const relatedImage = PlaceHolderImages.find(
                  (img) => img.id === relatedPost.imageId
                );
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    {relatedImage && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-4">
                        <Image
                          src={relatedImage.imageUrl}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={
                            relatedImage.imageHint || 'related post'
                          }
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {relatedPost.date}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
