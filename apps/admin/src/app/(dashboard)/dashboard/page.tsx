import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';

export default function MerchantDashboard() {
    const stats = [
        { name: 'Total Revenue', value: '$12,450.00', icon: TrendingUp, change: '+12.5%', color: 'text-green-600' },
        { name: 'Total Orders', value: '156', icon: ShoppingCart, change: '+18.2%', color: 'text-blue-600' },
        { name: 'Products', value: '42', icon: Package, change: '0%', color: 'text-indigo-600' },
        { name: 'Customers', value: '1.2k', icon: Users, change: '+5.4%', color: 'text-purple-600' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 leading-none">Welcome Back</h1>
                    <p className="text-slate-500 mt-2">Here's what's happening with your store today.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Store Live
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.name} className="border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {stat.name}
                            </CardTitle>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                            <p className={`text-xs font-bold mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-slate-400'}`}>
                                {stat.change} <span className="text-slate-400 font-medium">from last month</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Latest transactions from your customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-slate-400 text-sm text-center py-12 italic">
                            Order history will appear here...
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle>Inventory Quick Stats</CardTitle>
                        <CardDescription>Real-time product availability overview.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-slate-400 text-sm text-center py-12 italic">
                            Product data will appear here...
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
