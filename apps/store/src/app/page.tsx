'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ProvisioningModal } from '../components/landing/provisioning-modal';
import { SuccessModal } from '../components/landing/success-modal';
import { WhatsAppFAB } from '../components/landing/whatsapp-fab';

const ContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof ContactSchema>;

export default function LandingPage() {
  const [isProvisioningOpen, setIsProvisioningOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    storeName: string;
    storefrontUrl: string;
    adminUrl: string;
    email: string;
  } | null>(null);

  const [contactStatus, setContactStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [contactError, setContactError] = useState<string | null>(null);

  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    reset: resetContact,
    formState: { errors: contactErrors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
  });

  const onContactSubmit = async (data: ContactFormValues) => {
    setContactStatus('submitting');
    setContactError(null);
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setContactStatus('success');
      resetContact();
      setTimeout(() => setContactStatus('idle'), 5000);
    } catch (err: any) {
      setContactStatus('error');
      setContactError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg">
              60
            </div>
            <span className="text-xl font-bold tracking-tight">sec.shop</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://admin.60sec.shop"
              className="text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Admin Login
            </a>
            <button
              onClick={() => setIsProvisioningOpen(true)}
              className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">
                V2 Platform Now Live
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Launch your e-commerce <br className="hidden md:block" />
              empire in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                60 seconds
              </span>
              .
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Zero configuration. Military-grade security. Infinite scalability.
              Bring your products to the world with the fastest storefront
              engine ever built.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsProvisioningOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition duration-300 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                Create Store Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 px-6 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Instant Provisioning"
              description="No servers to configure. Your dedicated database and storage bucket are provisioned the moment you click create."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-emerald-400" />}
              title="Zero-Debt Security"
              description="Built on the S1-S15 protocol. Enterprise-grade tenant isolation, CAPTCHA bot-protection, and automated DDoS mitigation."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-blue-400" />}
              title="Global Edge Network"
              description="Your storefront runs on Edge infrastructure. Millisecond latency for your customers, no matter where they are."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section Placeholder */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Simple, transparent pricing
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              title="Free"
              price="$0"
              features={['1 Storefront', '50 Products', 'Community Support']}
            />
            <PricingCard
              title="Pro"
              price="$29"
              featured
              features={[
                'Unlimited Products',
                'Custom Domain',
                'Priority Support',
                'Advanced Analytics',
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              features={[
                'Dedicated Infrastructure',
                'SLA Guarantee',
                'Custom Blueprints',
                'Account Manager',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-6 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Have Questions?</h2>
            <p className="text-gray-400">
              Our enterprise support team is ready to help you scale.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            {contactStatus === 'success' ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Message Sent</h3>
                <p className="text-gray-400">
                  We'll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleContactSubmit(onContactSubmit)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    {...registerContact('name')}
                    disabled={contactStatus === 'submitting'}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  {contactErrors.name && (
                    <p className="text-red-400 text-xs mt-1">
                      {contactErrors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    {...registerContact('email')}
                    disabled={contactStatus === 'submitting'}
                    type="email"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  {contactErrors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {contactErrors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    {...registerContact('message')}
                    disabled={contactStatus === 'submitting'}
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  />
                  {contactErrors.message && (
                    <p className="text-red-400 text-xs mt-1">
                      {contactErrors.message.message}
                    </p>
                  )}
                </div>

                {contactStatus === 'error' && (
                  <p className="text-red-400 text-sm text-center">
                    {contactError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={contactStatus === 'submitting'}
                  className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                >
                  {contactStatus === 'submitting'
                    ? 'Sending...'
                    : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} 60sec.shop by Apex. All rights
          reserved.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Built with S1-S15 Military-Grade Compliance.
        </p>
      </footer>

      <ProvisioningModal
        isOpen={isProvisioningOpen}
        onClose={() => setIsProvisioningOpen(false)}
        onSuccess={(data) => {
          setIsProvisioningOpen(false);
          setSuccessData(data);
        }}
      />

      <SuccessModal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        storeName={successData?.storeName || ''}
        storefrontUrl={successData?.storefrontUrl || ''}
        adminUrl={successData?.adminUrl || ''}
        email={successData?.email || ''}
      />

      <WhatsAppFAB />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  featured = false,
}: {
  title: string;
  price: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-3xl border ${featured ? 'bg-gradient-to-b from-blue-900/20 to-transparent border-blue-500/50 relative' : 'bg-white/5 border-white/10'}`}
    >
      {featured && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Custom' && <span className="text-gray-500">/mo</span>}
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 rounded-xl font-semibold transition ${featured ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
      >
        Get Started
      </button>
    </div>
  );
}
