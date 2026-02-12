'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Share2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsProvider";

export default function ReferralPage() {
    const { toast } = useToast();
    const { language } = useSettings();
    const referralLink = "https://stylegrove.com/join?ref=JANA123";

    const t = {
        en: {
            copied: "Copied!",
            copiedDesc: "Referral link copied to clipboard.",
            title: "Refer a Friend",
            subtitle: "Share your love for StyleGrove and earn rewards. Give your friends $10 off their first order, and you'll get $10 in points for each successful referral.",
            referralLinkTitle: "Your Referral Link",
            copyLink: "Copy link",
            shareNow: "Share Now",
            friendsJoined: "Friends Joined",
            friendsJoinedDesc: "friends have used your link",
            rewardsEarned: "Rewards Earned",
            rewardsEarnedDesc: "in points earned so far",
        },
        ar: {
            copied: "تم النسخ!",
            copiedDesc: "تم نسخ رابط الإحالة إلى الحافظة.",
            title: "ادع صديقًا",
            subtitle: "شارك حبك لـ StyleGrove واكسب المكافآت. امنح أصدقائك خصمًا بقيمة 10 دولارات على طلبهم الأول، وستحصل على 10 دولارات في شكل نقاط عن كل إحالة ناجحة.",
            referralLinkTitle: "رابط الإحالة الخاص بك",
            copyLink: "نسخ الرابط",
            shareNow: "شارك الآن",
            friendsJoined: "الأصدقاء المنضمون",
            friendsJoinedDesc: "أصدقاء استخدموا رابطك",
            rewardsEarned: "المكافآت المكتسبة",
            rewardsEarnedDesc: "من النقاط المكتسبة حتى الآن",
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: t[language].copied, description: t[language].copiedDesc });
    }

    return (
        <div className="space-y-6">
            <header className="text-center">
                <Gift className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight mt-4">{t[language].title}</h1>
                <p className="mt-1 text-muted-foreground max-w-xl mx-auto">{t[language].subtitle}</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t[language].referralLinkTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input value={referralLink} readOnly />
                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t[language].copyLink}</span>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button>
                        <Share2 className="mr-2 h-4 w-4" /> {t[language].shareNow}
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t[language].friendsJoined}</CardTitle>
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">5</p>
                        <p className="text-sm text-muted-foreground">{t[language].friendsJoinedDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t[language].rewardsEarned}</CardTitle>
                        <Gift className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <p className="text-4xl font-bold">$50</p>
                        <p className="text-sm text-muted-foreground">{t[language].rewardsEarnedDesc}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
