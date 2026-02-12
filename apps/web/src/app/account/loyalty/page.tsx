'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award } from "lucide-react";
import { useSettings } from "@/contexts/SettingsProvider";

// Mock data
const loyaltyData = {
    points: 150,
    tier: "Silver",
    pointsToNextTier: 350,
    history: [
        { id: 1, date: "2024-07-25", activity: "Purchase #ORD-12345", points: 50 },
        { id: 2, date: "2024-07-20", activity: "Wrote a review", points: 10 },
        { id: 3, date: "2024-07-10", activity: "Purchase #ORD-12342", points: 90 },
    ]
};

export default function LoyaltyPage() {
    const { language } = useSettings();
    const t = {
        en: {
            title: "Loyalty Program",
            subtitle: "Your rewards and tier status.",
            yourPoints: "Your Points",
            pointsAvailable: "points available",
            tierStatus: "Tier Status",
            youAreA: "You are a",
            member: "member",
            pointsToReach: "points to reach Gold tier",
            pointsHistory: "Points History",
            historyDesc: "A log of your points earned and spent.",
            date: "Date",
            activity: "Activity",
            points: "Points",
            purchase: "Purchase",
            wroteReview: "Wrote a review"
        },
        ar: {
            title: "برنامج الولاء",
            subtitle: "مكافآتك وحالة مستواك.",
            yourPoints: "نقاطك",
            pointsAvailable: "نقطة متاحة",
            tierStatus: "حالة المستوى",
            youAreA: "أنت عضو",
            member: "",
            pointsToReach: "نقطة للوصول إلى المستوى الذهبي",
            pointsHistory: "سجل النقاط",
            historyDesc: "سجل بالنقاط التي كسبتها وأنفقتها.",
            date: "التاريخ",
            activity: "النشاط",
            points: "النقاط",
            purchase: "شراء",
            wroteReview: "كتب مراجعة"
        }
    }
    const progress = (loyaltyData.points / (loyaltyData.points + loyaltyData.pointsToNextTier)) * 100;
    
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t[language].title}</h1>
                <p className="mt-1 text-muted-foreground">{t[language].subtitle}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t[language].yourPoints}</CardTitle>
                        <Award className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold">{loyaltyData.points}</p>
                        <p className="text-muted-foreground">{t[language].pointsAvailable}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t[language].tierStatus}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold mb-2">{t[language].youAreA} <span className="text-primary">{loyaltyData.tier}</span> {t[language].member}</p>
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">{loyaltyData.pointsToNextTier} {t[language].pointsToReach}</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t[language].pointsHistory}</CardTitle>
                    <CardDescription>{t[language].historyDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t[language].date}</TableHead>
                                <TableHead>{t[language].activity}</TableHead>
                                <TableHead className="text-right">{t[language].points}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loyaltyData.history.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>
                                        {item.activity.includes("Purchase") ? `${t[language].purchase} ${item.activity.split(' ')[1]}` : t[language].wroteReview}
                                    </TableCell>
                                    <TableCell className={`text-right font-medium text-green-600`}>
                                        {item.points > 0 ? '+' : ''}{item.points}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
