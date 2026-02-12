'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

const NEWSLETTER_POPUP_KEY = 'stylegrove-newsletter-popup-closed';

export function NewsletterPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const { language } = useSettings();

    const t = {
        en: {
            subscribedTitle: "Subscribed!",
            subscribedDesc: "Thanks for joining our newsletter. Check your email for a welcome discount!",
            title: "Join Our Newsletter",
            description: "Subscribe to get 10% off your first order, plus updates on new arrivals and exclusive deals.",
            placeholder: "Enter your email",
            submit: "Subscribe"
        },
        ar: {
            subscribedTitle: "تم الاشتراك!",
            subscribedDesc: "شكرًا لانضمامك إلى نشرتنا الإخبارية. تحقق من بريدك الإلكتروني للحصول على خصم ترحيبي!",
            title: "انضم إلى نشرتنا الإخبارية",
            description: "اشترك للحصول على خصم 10٪ على طلبك الأول، بالإضافة إلى تحديثات حول المنتجات الجديدة والصفقات الحصرية.",
            placeholder: "أدخل بريدك الإلكتروني",
            submit: "اشترك"
        }
    };

    useEffect(() => {
        const popupClosed = localStorage.getItem(NEWSLETTER_POPUP_KEY);
        // Show popup only if it hasn't been closed before
        if (!popupClosed) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 15000); // 15-second delay as per spec

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        // Don't show again for 7 days
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        localStorage.setItem(NEWSLETTER_POPUP_KEY, expiry.toISOString());
        setIsOpen(false);
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: t[language].subscribedTitle,
            description: t[language].subscribedDesc,
        });
        handleClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                       <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl">{t[language].title}</DialogTitle>
                    <DialogDescription>
                       {t[language].description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                    <Input type="email" placeholder={t[language].placeholder} required className="flex-1" />
                    <Button type="submit">{t[language].submit}</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
