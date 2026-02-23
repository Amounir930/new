'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BulkImportUI from '@/components/products/BulkImportUI';
import { useRouter } from 'next/navigation';

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [storeName, setStoreName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call to Admin-#01 Identity Settings
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1000);
    };

    const finishOnboarding = () => {
        router.push('/dashboard'); // Planned dashboard route
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Progress Tracker */}
                <div className="flex justify-between items-center px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {s}
                            </div>
                            <span className={`text-sm font-medium ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {s === 1 ? 'Identity' : s === 2 ? 'Inventory' : 'Finish'}
                            </span>
                            {s < 3 && <div className="w-12 h-px bg-slate-200" />}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <Card className="border-none shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Let's set up your store
                            </CardTitle>
                            <CardDescription>First, give your store a name and identity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleIdentitySubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Store Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. My Amazing Shop"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        required
                                        className="h-12 text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logo">Logo (Optional)</Label>
                                    <Input id="logo" type="file" className="h-auto p-2 border-dashed border-2" />
                                </div>
                                <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold">
                                    {loading ? 'Saving...' : 'Continue to Inventory'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <header className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Populate your catalog</h2>
                            <p className="text-slate-500">Upload your existing products here.</p>
                        </header>
                        <BulkImportUI />
                        <div className="mt-6 flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)} className="bg-slate-900 text-white">Skip for now</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <Card className="border-none shadow-2xl text-center p-8 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <CardTitle className="text-3xl font-black mb-2">You're all set!</CardTitle>
                        <CardDescription className="text-lg">
                            Your store <strong>{storeName}</strong> is ready for business.
                        </CardDescription>
                        <Button onClick={finishOnboarding} className="mt-8 h-12 px-8 bg-indigo-600 text-lg font-bold">
                            Go to Dashboard
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
