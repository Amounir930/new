'use client';
import { useState } from 'react';
export function Hero() {
    const [email, setEmail] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Submit to API
        console.log('Lead captured:', email);
        alert("Thanks! We'll be in touch soon.");
        setEmail('');
    };
    return (<section className="relative bg-gradient-to-br from-primary-600 to-primary-800 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Launch Your Store in
            <span className="block text-primary-200">60 Seconds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
            The multi-tenant e-commerce platform that scales with your business.
            From landing page to live store + mobile app in under a minute.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md">
            <div className="flex gap-3">
              <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"/>
              <button type="submit" className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-white">
                Start Free
              </button>
            </div>
            <p className="mt-3 text-sm text-primary-200">
              No credit card required. 14-day free trial.
            </p>
          </form>
        </div>
      </div>
    </section>);
}
