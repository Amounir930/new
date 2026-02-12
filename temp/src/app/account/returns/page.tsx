'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsProvider";
import { useState } from "react";

export default function ReturnsPage() {
    const { language } = useSettings();
    const { toast } = useToast();
    const [orderId, setOrderId] = useState('');
    const [reason, setReason] = useState('');

    const t = {
        en: {
            title: "Start a Return",
            subtitle: "Let us know which order you'd like to return.",
            orderId: "Order ID",
            orderIdPlaceholder: "e.g., ORD-12345",
            reasonForReturn: "Reason for Return",
            reasonPlaceholder: "Please describe the issue with the item...",
            submit: "Submit Request",
            requestSubmitted: "Return Request Submitted",
            requestSubmittedDesc: "We've received your request. You'll get an email with the next steps shortly.",
        },
        ar: {
            title: "بدء عملية إرجاع",
            subtitle: "أخبرنا بالطلب الذي ترغب في إرجاعه.",
            orderId: "رقم الطلب",
            orderIdPlaceholder: "مثال: ORD-12345",
            reasonForReturn: "سبب الإرجاع",
            reasonPlaceholder: "يرجى وصف المشكلة في المنتج...",
            submit: "إرسال الطلب",
            requestSubmitted: "تم إرسال طلب الإرجاع",
            requestSubmittedDesc: "لقد استلمنا طلبك. ستتلقى بريدًا إلكترونيًا بالخطوات التالية قريبًا.",
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t[language].requestSubmitted,
            description: t[language].requestSubmittedDesc,
        });
        setOrderId('');
        setReason('');
    };
    
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t[language].title}</h1>
                <p className="mt-1 text-muted-foreground">{t[language].subtitle}</p>
            </header>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderId">{t[language].orderId}</Label>
                            <Input 
                                id="orderId" 
                                placeholder={t[language].orderIdPlaceholder} 
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                required 
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="reason">{t[language].reasonForReturn}</Label>
                            <Textarea 
                                id="reason" 
                                placeholder={t[language].reasonPlaceholder}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required 
                                rows={5}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">{t[language].submit}</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
