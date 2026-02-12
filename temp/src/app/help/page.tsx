'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import {
  aiHelpCenterSearch,
  AiHelpCenterSearchOutput,
} from '@/ai/flows/ai-help-center-search';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsProvider';

export default function HelpCenterPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AiHelpCenterSearchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();

  const t = {
    en: {
      title: 'Help Center',
      subtitle: 'How can we help you today?',
      placeholder: 'Search our knowledge base...',
      search: 'Search',
      error: 'Sorry, something went wrong. Please try again.',
      errorTitle: 'Error',
      answer: 'Answer',
      askAQuestion: 'Ask a question to get started.',
      example: 'For example: "What is your return policy?"',
    },
    ar: {
      title: 'مركز المساعدة',
      subtitle: 'كيف يمكننا مساعدتك اليوم؟',
      placeholder: 'ابحث في قاعدة المعرفة لدينا...',
      search: 'بحث',
      error: 'عذرًا، حدث خطأ ما. يرجى المحاولة مرة أخرى.',
      errorTitle: 'خطأ',
      answer: 'الإجابة',
      askAQuestion: 'اطرح سؤالاً للبدء.',
      example: 'مثال: "ما هي سياسة الإرجاع الخاصة بكم؟"',
    },
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const searchResult = await aiHelpCenterSearch({ query });
      setResult(searchResult);
    } catch (err) {
      setError(t[language].error);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <Input
            type="search"
            placeholder={t[language].placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span className="sr-only">{t[language].search}</span>
          </Button>
        </form>

        <div className="min-h-[12rem] space-y-6">
          {isLoading && (
            <div className="flex justify-center pt-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t[language].errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>{t[language].answer}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {result.answer}
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !result && !error && (
            <Card className="flex h-48 items-center justify-center text-center">
              <CardContent className="p-8">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {t[language].askAQuestion}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t[language].example}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
