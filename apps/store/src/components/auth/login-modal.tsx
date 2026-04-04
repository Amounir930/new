'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { z } from 'zod';
import { Loader2, X, Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import {
  loginCustomer,
  registerCustomer,
  mergeCustomerCart,
} from '@/lib/api';
import { useAuthStore, useMountedAuth } from '@/lib/auth-store';
import { useMountedCart } from '@/lib/cart-store';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMAS (mirrors backend validation)
// ═══════════════════════════════════════════════════════════════

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    ),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  acceptsMarketing: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof LoginSchema>;
type RegisterFormData = z.infer<typeof RegisterSchema>;

// ═══════════════════════════════════════════════════════════════
// LOGIN MODAL
// ═══════════════════════════════════════════════════════════════

export function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    setAuthenticated,
    getAndClearAuthIntent,
    isAuthenticating,
    setAuthenticating,
  } = useMountedAuth();

  const cart = useMountedCart();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regAcceptsMarketing, setRegAcceptsMarketing] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Reset form on modal close
  useEffect(() => {
    if (!isLoginModalOpen) {
      setFieldErrors({});
      setShowPassword(false);
      setLoginEmail('');
      setLoginPassword('');
      setRegEmail('');
      setRegPassword('');
      setRegFirstName('');
      setRegLastName('');
      setRegAcceptsMarketing(false);
    }
  }, [isLoginModalOpen]);

  // ─── Login Handler ──────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    const parsed = LoginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const err of parsed.error.errors) {
        errors[err.path[0]] = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setAuthenticating(true);

    try {
      const data = await loginCustomer(loginEmail, loginPassword);

      if (data.success && data.customer) {
        setAuthenticated(data.customer);

        // Cart merge: merge session cart with customer cart
        try {
          await mergeCustomerCart();
          // Refresh cart state after merge
          await cart.refreshCart();
        } catch {
          // Non-critical — cart will sync on next action
        }

        toast.success('Welcome back!');

        // Execute pending intent
        const intent = getAndClearAuthIntent();
        if (intent) {
          // Intent execution handled by the calling component
          toast.success('Action completed after login');
        }

        closeLoginModal();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setAuthenticating(false);
    }
  }, [
    loginEmail,
    loginPassword,
    setAuthenticated,
    getAndClearAuthIntent,
    closeLoginModal,
    setAuthenticating,
    cart,
  ]);

  // ─── Register Handler ───────────────────────────────────────
  const handleRegister = useCallback(async () => {
    const parsed = RegisterSchema.safeParse({
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      acceptsMarketing: regAcceptsMarketing,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const err of parsed.error.errors) {
        errors[err.path[0]] = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setAuthenticating(true);

    try {
      const data = await registerCustomer({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        acceptsMarketing: regAcceptsMarketing,
      });

      if (data.success && data.customer) {
        setAuthenticated(data.customer);
        toast.success('Account created successfully!');
        closeLoginModal();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setAuthenticating(false);
    }
  }, [
    regEmail,
    regPassword,
    regFirstName,
    regLastName,
    regAcceptsMarketing,
    setAuthenticated,
    closeLoginModal,
    setAuthenticating,
  ]);

  // ─── Key Handler (Enter to submit) ─────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (activeTab === 'login') {
          startTransition(() => handleLogin());
        } else {
          startTransition(() => handleRegister());
        }
      }
    },
    [activeTab, handleLogin, handleRegister]
  );

  const isLoading = isPending || isAuthenticating;

  return (
    <Dialog.Root open={isLoginModalOpen} onOpenChange={(open) => !open && closeLoginModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={handleKeyDown}
          className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-0 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-5 w-5 text-gray-400" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setFieldErrors({});
              }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === 'login'
                  ? 'border-b-2 border-black text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setFieldErrors({});
              }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === 'register'
                  ? 'border-b-2 border-black text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">
            {/* ═══ LOGIN TAB ═══ */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500">
                  Enter your credentials to access your account.
                </p>

                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-semibold text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                        fieldErrors.email
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-10 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                        fieldErrors.password
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="button"
                  onClick={() => startTransition(() => handleLogin())}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            )}

            {/* ═══ REGISTER TAB ═══ */}
            {activeTab === 'register' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Create your account
                </h2>
                <p className="text-sm text-gray-500">
                  Join us and start shopping with a personalized experience.
                </p>

                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-fname"
                      className="mb-1.5 block text-xs font-semibold text-gray-700"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="reg-fname"
                        type="text"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Ahmed"
                        autoComplete="given-name"
                        className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                          fieldErrors.firstName
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="reg-lname"
                      className="mb-1.5 block text-xs font-semibold text-gray-700"
                    >
                      Last Name
                    </label>
                    <input
                      id="reg-lname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Al-Rashid"
                      autoComplete="family-name"
                      className={`w-full rounded-xl border bg-gray-50 py-3 px-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                        fieldErrors.lastName
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="mb-1.5 block text-xs font-semibold text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                        fieldErrors.email
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="mb-1.5 block text-xs font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase + number"
                      autoComplete="new-password"
                      className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-10 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                        fieldErrors.password
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Marketing opt-in */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regAcceptsMarketing}
                    onChange={(e) => setRegAcceptsMarketing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-xs text-gray-500">
                    I agree to receive promotional emails and updates. You can
                    unsubscribe at any time.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="button"
                  onClick={() => startTransition(() => handleRegister())}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
