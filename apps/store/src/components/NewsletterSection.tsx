'use client';

import { useState } from 'react';

export function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/storefront/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) throw new Error('Failed to subscribe');

            setStatus('success');
            setMessage('Thank you for subscribing!');
            setEmail('');
        } catch (error) {
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    return (
        <section className="bg-blue-600 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-16 md:px-16 md:py-24 flex flex-col items-center text-center space-y-8">
                <div className="space-y-4 max-w-2xl">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                        Join the APEX Club
                    </h2>
                    <p className="text-blue-100 text-lg md:text-xl font-medium">
                        Get exclusive early access to new collections and special offers.
                        No spam, just pure goodness.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md flex flex-col sm:flex-row gap-4"
                >
                    <input
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'loading' || status === 'success'}
                        className="flex-1 px-6 py-4 rounded-full bg-white/10 border-2 border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-white transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className="px-8 py-4 rounded-full bg-white text-blue-600 font-black hover:bg-gray-100 transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {status === 'loading' ? 'Joining...' : 'Subscribe'}
                    </button>
                </form>

                {message && (
                    <p className={`font-bold transition-all ${status === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                        {message}
                    </p>
                )}
            </div>
        </section>
    );
}
