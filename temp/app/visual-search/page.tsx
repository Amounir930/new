'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsProvider';
import { visualSearch } from '@/ai/flows/visual-search';
import { products } from '@/lib/data';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import Image from 'next/image';

export default function VisualSearchPage() {
  const { language } = useSettings();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);

  const t = {
    en: {
      title: 'Visual Search',
      subtitle:
        'Find similar products by uploading a photo or using your camera.',
      upload: 'Upload Image',
      useCamera: 'Use Camera',
      search: 'Search',
      takePicture: 'Take Picture',
      searching: 'Searching...',
      resultsTitle: 'We found these items for you',
      noResults: 'No similar products found.',
      noResultsDesc: 'Try a different image or check back later.',
      error: 'An error occurred during the search. Please try again.',
      errorTitle: 'Search Error',
      clear: 'Clear Image',
      cameraDeniedTitle: 'Camera Access Denied',
      cameraDeniedDesc: 'Please enable camera permissions to use this feature.',
      cameraRequiredTitle: 'Camera Access Required',
      cameraRequiredDesc: 'Please allow camera access to use this feature.',
      cancel: 'Cancel',
      imagePreviewAlt: 'Image preview',
    },
    ar: {
      title: 'البحث بالصور',
      subtitle: 'ابحث عن منتجات مشابهة عن طريق تحميل صورة أو استخدام الكاميرا.',
      upload: 'تحميل صورة',
      useCamera: 'استخدام الكاميرا',
      search: 'بحث',
      takePicture: 'التقاط صورة',
      searching: 'جاري البحث...',
      resultsTitle: 'وجدنا هذه المنتجات لك',
      noResults: 'لم يتم العثور على منتجات مشابهة.',
      noResultsDesc: 'جرب صورة مختلفة أو تحقق مرة أخرى لاحقًا.',
      error: 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.',
      errorTitle: 'خطأ في البحث',
      clear: 'مسح الصورة',
      cameraDeniedTitle: 'تم رفض الوصول إلى الكاميرا',
      cameraDeniedDesc: 'يرجى تمكين أذونات الكاميرا لاستخدام هذه الميزة.',
      cameraRequiredTitle: 'الوصول إلى الكاميرا مطلوب',
      cameraRequiredDesc:
        'يرجى السماح بالوصول إلى الكاميرا لاستخدام هذه الميزة.',
      cancel: 'إلغاء',
      imagePreviewAlt: 'معاينة الصورة',
    },
  };

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!showCamera) {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        setShowCamera(false);
        toast({
          variant: 'destructive',
          title: t[language].cameraDeniedTitle,
          description: t[language].cameraDeniedDesc,
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCamera, toast, language, t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setResults([]);
        setReasoning('');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageSrc(dataUrl);
      setShowCamera(false);
    }
  };

  const handleSearch = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const searchResult = await visualSearch({
        imageDataUri: imageSrc,
        productCatalog: products.map((p) => p.name),
      });

      if (
        searchResult.recommendations &&
        searchResult.recommendations.length > 0
      ) {
        const foundProducts = products.filter((p) =>
          searchResult.recommendations.includes(p.name)
        );
        setResults(foundProducts);
        setReasoning(searchResult.reasoning);
      } else {
        setResults([]);
        setReasoning(t[language].noResults);
      }
    } catch (err) {
      setError(t[language].error);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImageSrc(null);
    setResults([]);
    setReasoning('');
    setError(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-6">
            {!imageSrc && !showCamera && (
              <div className="flex flex-col items-center justify-center gap-4 h-64">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
                <div className="flex gap-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" /> {t[language].upload}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCamera(true)}>
                    <Camera className="mr-2 h-4 w-4" /> {t[language].useCamera}
                  </Button>
                </div>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            )}

            {showCamera && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-md bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full aspect-video rounded-md"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
                {hasCameraPermission === false && (
                  <Alert variant="destructive">
                    <AlertTitle>{t[language].cameraRequiredTitle}</AlertTitle>
                    <AlertDescription>
                      {t[language].cameraRequiredDesc}
                    </AlertDescription>
                  </Alert>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTakePicture}
                    disabled={!hasCameraPermission}
                  >
                    <Camera className="mr-2 h-4 w-4" />{' '}
                    {t[language].takePicture}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCamera(false)}
                  >
                    {t[language].cancel}
                  </Button>
                </div>
              </div>
            )}

            {imageSrc && !showCamera && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-md border rounded-lg p-2">
                  <Image
                    src={imageSrc}
                    alt={t[language].imagePreviewAlt}
                    width={500}
                    height={500}
                    className="rounded-md object-contain max-h-96 w-auto mx-auto"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={clearImage}
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">{t[language].clear}</span>
                  </Button>
                </div>
                <Button onClick={handleSearch} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? t[language].searching : t[language].search}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-8">
            <AlertTitle>{t[language].errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && !isLoading && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              {t[language].resultsTitle}
            </h2>
            {reasoning && (
              <p className="text-muted-foreground text-center mt-1">
                {reasoning}
              </p>
            )}
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && reasoning && !isLoading && !error && (
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold">{t[language].noResults}</h3>
            <p className="text-muted-foreground mt-2">
              {t[language].noResultsDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
