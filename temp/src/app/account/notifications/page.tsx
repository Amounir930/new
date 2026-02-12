'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsProvider";
import { Bell, Tag, Truck } from "lucide-react";

export default function NotificationsPage() {
    const { language } = useSettings();

    const t = {
        en: {
            title: "Notifications",
            noNotifications: "No notifications yet",
            noNotificationsDesc: "We'll let you know when something important happens.",
            notifications: [
                { id: 1, type: 'sale', title: 'Flash Sale Alert!', description: 'Get 30% off on all summer dresses for the next 24 hours.', date: '2 hours ago', read: false, icon: <Tag className="h-5 w-5 text-primary" /> },
                { id: 2, type: 'order', title: 'Your order has shipped', description: 'Order #ORD-12344 is on its way to you. Track it now.', date: '1 day ago', read: false, icon: <Truck className="h-5 w-5 text-blue-500" /> },
                { id: 3, type: 'general', title: 'Welcome to StyleGrove!', description: 'We are so happy to have you. Explore our collections now.', date: '3 days ago', read: true, icon: <Bell className="h-5 w-5 text-muted-foreground" /> },
            ]
        },
        ar: {
            title: "الإشعارات",
            noNotifications: "لا توجد إشعارات بعد",
            noNotificationsDesc: "سنخبرك عندما يحدث شيء مهم.",
            notifications: [
                { id: 1, type: 'sale', title: 'تنبيه تخفيضات فلاش!', description: 'احصل على خصم 30٪ على جميع فساتين الصيف لمدة 24 ساعة القادمة.', date: 'منذ ساعتين', read: false, icon: <Tag className="h-5 w-5 text-primary" /> },
                { id: 2, type: 'order', title: 'تم شحن طلبك', description: 'الطلب رقم ORD-12344 في طريقه إليك. تتبعه الآن.', date: 'منذ يوم واحد', read: false, icon: <Truck className="h-5 w-5 text-blue-500" /> },
                { id: 3, type: 'general', title: 'مرحبًا بك في ستايل جروف!', description: 'نحن سعداء جدًا بوجودك. استكشف مجموعاتنا الآن.', date: 'منذ 3 أيام', read: true, icon: <Bell className="h-5 w-5 text-muted-foreground" /> },
            ]
        }
    };
    
    const mockNotifications = t[language].notifications;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t[language].title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {mockNotifications.map(notification => (
                        <div key={notification.id} className={`flex items-start gap-4 p-4 rounded-lg ${!notification.read ? 'bg-muted/50' : ''}`}>
                            <div className="mt-1">
                                {notification.icon}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {notification.date}
                            </div>
                        </div>
                    ))}
                </div>
                {mockNotifications.length === 0 && (
                    <div className="text-center py-12">
                        <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">{t[language].noNotifications}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                           {t[language].noNotificationsDesc}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
