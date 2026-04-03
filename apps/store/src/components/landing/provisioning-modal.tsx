'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const ProvisioningSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores.'),
  storeName: z.string().min(2).max(100, 'Store name is required'),
  email: z.string().email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string(),
  plan: z.enum(['free', 'pro'], { errorMap: () => ({ message: 'Please select a plan' }) }),
  category: z.string().min(1, 'Please select a store category'),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  turnstileToken: z.string().min(1, 'Please complete the CAPTCHA'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const OTPSchema = z.object({
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

type ProvisioningFormValues = z.infer<typeof ProvisioningSchema>;
type OTPFormValues = z.infer<typeof OTPSchema>;

interface ProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { storeName: string; adminUrl: string; email: string }) => void;
}

export function ProvisioningModal({ isOpen, onClose, onSuccess }: ProvisioningModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register: registerProv,
    handleSubmit: handleProvSubmit,
    setValue,
    formState: { errors: provErrors, isSubmitting: isProvSubmitting },
    watch
  } = useForm<ProvisioningFormValues>({
    resolver: zodResolver(ProvisioningSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors, isSubmitting: isOTPSubmitting },
  } = useForm<OTPFormValues>({
    resolver: zodResolver(OTPSchema),
  });

  const onProvisioningSubmit = async (data: ProvisioningFormValues) => {
    setApiError(null);
    try {
      const res = await fetch('/api/v1/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // P2 FIX: Check Content-Type before parsing JSON to prevent "Unexpected token '<'" crash
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Server error (${res.status}). Please try again later.`);
      }

      const result = await res.json();

      if (!res.ok) {
        // Extract human-readable error from validationErrors array
        const fieldError = result.validationErrors?.find((e: { path?: string }) => e.path?.includes('password'));
        const humanMessage = fieldError?.message || result.message || 'Failed to initialize request';
        throw new Error(humanMessage);
      }

      setRequestId(result.requestId);
      setStep(2);
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const onVerifySubmit = async (data: OTPFormValues) => {
    setApiError(null);
    if (!requestId) return;

    try {
      const res = await fetch('/api/v1/auth/register-tenant/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, otp: data.otp }),
      });

      // P2 FIX: Check Content-Type before parsing JSON to prevent "Unexpected token '<'" crash
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Server error (${res.status}). Please try again later.`);
      }

      const result = await res.json();

      if (!res.ok) {
        const fieldError = result.validationErrors?.find((e: { path?: string }) => e.path?.includes('otp'));
        const humanMessage = fieldError?.message || result.message || 'Failed to verify code';
        throw new Error(humanMessage);
      }

      onSuccess({
        storeName: watch('storeName'),
        adminUrl: result.data.activationUrl,
        email: watch('email'),
      });
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create your store</h2>
              <p className="text-gray-400 mb-6 text-sm">Join thousands of merchants powering their businesses with 60sec.shop.</p>

              {apiError && (
                <div className="mb-4 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleProvSubmit(onProvisioningSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username (Store URL)</label>
                  <div className="relative">
                    <input
                      {...registerProv('username')}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white pr-24 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="my-store"
                    />
                    <div className="absolute right-3 top-2.5 text-gray-500 text-sm">.60sec.shop</div>
                  </div>
                  {provErrors.username && <p className="text-red-400 text-xs mt-1">{provErrors.username.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Store Name</label>
                  <input
                    {...registerProv('storeName')}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="My Store"
                  />
                  {provErrors.storeName && <p className="text-red-400 text-xs mt-1">{provErrors.storeName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    {...registerProv('email')}
                    type="email"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="admin@example.com"
                  />
                  {provErrors.email && <p className="text-red-400 text-xs mt-1">{provErrors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                      {...registerProv('password')}
                      type="password"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {provErrors.password && <p className="text-red-400 text-xs mt-1">{provErrors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm</label>
                    <input
                      {...registerProv('confirmPassword')}
                      type="password"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {provErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{provErrors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Plan</label>
                    <select
                      {...registerProv('plan')}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                      <option value="">Select Plan</option>
                      <option value="free">Free ($0/mo)</option>
                      <option value="pro">Pro ($29/mo)</option>
                    </select>
                    {provErrors.plan && <p className="text-red-400 text-xs mt-1">{provErrors.plan.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Store Category</label>
                    <select
                      {...registerProv('category')}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                      <option value="">Select Category</option>
                      <option value="retail">Retail & Shop</option>
                      <option value="wellness">Wellness & Health</option>
                      <option value="food">Food & Restaurant</option>
                      <option value="education">Education</option>
                      <option value="professional">Professional Services</option>
                      <option value="digital">Digital Products</option>
                    </select>
                    {provErrors.category && <p className="text-red-400 text-xs mt-1">{provErrors.category.message}</p>}
                  </div>
                </div>

                <div className="flex items-start mt-4 mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      {...registerProv('terms')}
                      className="w-4 h-4 rounded bg-gray-900 border-gray-700"
                    />
                  </div>
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                    I agree to the <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>.
                  </label>
                </div>
                {provErrors.terms && <p className="text-red-400 text-xs mt-1">{provErrors.terms.message}</p>}

                <div className="my-4 flex justify-center">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => setValue('turnstileToken', token, { shouldValidate: true })}
                    options={{ theme: 'dark' }}
                  />
                </div>
                {provErrors.turnstileToken && <p className="text-red-400 text-xs text-center">{provErrors.turnstileToken.message}</p>}

                <button
                  type="submit"
                  disabled={isProvSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center transition disabled:opacity-70"
                >
                  {isProvSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Store'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-gray-400 text-sm">We've sent a 6-digit verification code to <strong>{watch('email')}</strong>. The code expires in 5 minutes.</p>
              </div>

              {apiError && (
                <div className="mb-4 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20 text-center">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleOTPSubmit(onVerifySubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 text-center">Verification Code</label>
                  <input
                    {...registerOTP('otp')}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                  {otpErrors.otp && <p className="text-red-400 text-xs mt-1 text-center">{otpErrors.otp.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isOTPSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center transition disabled:opacity-70 mt-4"
                >
                  {isOTPSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Launch Store'}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
