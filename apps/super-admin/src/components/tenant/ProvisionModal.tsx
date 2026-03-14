'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiFetch } from '@/lib/api';

const provisionSchema = z
  .object({
    storeName: z
      .string()
      .min(2, 'Store name must be at least 2 characters')
      .max(100)
      .regex(
        /^[\w\s.,!?@#&\-()[\]]+$/,
        'Store name contains forbidden characters'
      ),
    subdomain: z
      .string()
      .min(3, 'Subdomain must be at least 3 characters')
      .regex(
        /^(?=.*[a-z])[a-z0-9_-]+$/,
        'Must contain a lowercase letter and use [a-z0-9_-]'
      ),
    adminEmail: z.string().email('Invalid email address'),
    plan: z.enum(['free', 'basic', 'pro', 'enterprise']),
    password: z
      .string()
      .min(8, 'Banking-Grade: Minimum 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_.])[A-Za-z\d@$!%*?&#_.-]{8,}$/,
        'Requires uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string(),
    superAdminKey: z
      .string()
      .min(32, 'Sovereign Key must be at least 32 characters'),
    blueprintId: z.string().transform((val) => (val === '' ? undefined : val)),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProvisionFormValues = z.infer<typeof provisionSchema>;

interface ProvisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Blueprint {
  id: string;
  name: string;
  version: string;
  plan: string;
  status: string;
}

export function ProvisionModal({
  open,
  onOpenChange,
  onSuccess,
}: ProvisionModalProps) {
  const [loading, setLoading] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isValid },
  } = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      storeName: '',
      subdomain: '',
      adminEmail: '',
      plan: 'free',
      superAdminKey: '',
    },
  });

  const selectedPlan = watch('plan');

  useEffect(() => {
    async function fetchBlueprints() {
      try {
        const data = await apiFetch('/blueprints');
        // Filter blueprints by selected plan if they exist
        setBlueprints(Array.isArray(data) ? data : []);
      } catch (_e) {
        /* 'Failed to fetch blueprints:', e */
      }
    }
    if (open) {
      fetchBlueprints();
    }
  }, [open]);

  // Filter blueprints to match selected plan
  const filteredBlueprints = blueprints.filter(
    (b) => b.plan === selectedPlan && b.status !== 'paused'
  );

  if (!open) return null;

  async function onSubmit(values: ProvisionFormValues) {
    try {
      setLoading(true);
      setError('root', { message: '' });
      await apiFetch('/provision', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (e: unknown) {
      if (e instanceof ApiError && e.data?.validationErrors) {
        const vErrors = e.data.validationErrors;
        vErrors.forEach((err: any) => {
          const fieldName = err.path?.[0];
          if (fieldName) {
            setError(fieldName as any, {
              type: 'server',
              message: err.message,
            });
          }
        });
        setError('root', {
          message:
            'Architectural Lockdown: Multiple validation failures detected.',
        });
      } else {
        setError('root', {
          message: e instanceof Error ? e.message : 'Provisioning failed',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-background/80 backdrop-blur-xl border-2 border-primary/20 rounded-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Sovereign Provisioning
              </h2>
              <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest font-semibold opacity-70">
                Architectural Lockdown Protocol
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

          {errors.root?.message && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg animate-in shake-in-1 duration-300 flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{errors.root.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="storeName"
                className="text-sm font-medium flex items-center"
              >
                Store Identity <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="storeName"
                placeholder="Apex Global Ventures"
                className="border-2 bg-background/50 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                {...register('storeName')}
              />
              {errors.storeName && (
                <p className="text-destructive text-[11px] font-medium mt-1">
                  {errors.storeName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="subdomain"
                className="text-sm font-medium flex items-center"
              >
                Sovereign Subdomain{' '}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="subdomain"
                  placeholder="global-market"
                  className="border-2 bg-background/50 pr-24 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                  {...register('subdomain')}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground/60 text-sm font-mono border-l pl-3">
                    .60sec.shop
                  </span>
                </div>
              </div>
              {errors.subdomain && (
                <p className="text-destructive text-[11px] font-medium mt-1">
                  {errors.subdomain.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="adminEmail"
                className="text-sm font-medium flex items-center"
              >
                Merchant Custodian{' '}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="custodian@apex.com"
                className="border-2 bg-background/50 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                {...register('adminEmail')}
              />
              {errors.adminEmail && (
                <p className="text-destructive text-[11px] font-medium mt-1">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  title="Military-Grade: Upper, Lower, Number, Special"
                  className="text-sm font-medium flex items-center"
                >
                  Access Key <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-2 bg-background/50 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-destructive text-[10px] leading-tight font-medium mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Verification
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="border-2 bg-background/50 focus-visible:ring-primary/30 transition-all duration-200"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-[10px] font-medium mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-sm font-medium">
                  Service Tier
                </Label>
                <select
                  id="plan"
                  {...register('plan')}
                  className="flex h-10 w-full rounded-md border-2 border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                >
                  <option value="free">Free Tier</option>
                  <option value="basic">Basic Growth</option>
                  <option value="pro">Pro Scale</option>
                  <option value="enterprise">Enterprise Sovereign</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blueprintId" className="text-sm font-medium">
                  Blueprint Override
                </Label>
                <select
                  id="blueprintId"
                  {...register('blueprintId')}
                  className="flex h-10 w-full rounded-md border-2 border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                  disabled={filteredBlueprints.length === 0}
                >
                  <option value="">System Default</option>
                  {filteredBlueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (v{b.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="superAdminKey"
                className="text-sm font-medium flex items-center text-primary/80"
              >
                Sovereign Authorization{' '}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="superAdminKey"
                type="password"
                placeholder="APEX-MASTER-KEY-••••••••"
                className="border-2 bg-primary/5 focus-visible:ring-primary/40 focus-visible:border-primary transition-all duration-200 border-primary/20"
                {...register('superAdminKey')}
              />
              {errors.superAdminKey && (
                <p className="text-destructive text-[11px] font-bold mt-1">
                  {errors.superAdminKey.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isValid}
                className={`relative overflow-hidden transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 ${
                  !isValid
                    ? 'opacity-50 grayscale cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span className="relative z-10">
                  {loading
                    ? 'Executing Protocol...'
                    : 'Initialize Provisioning'}
                </span>
                {!loading && isValid && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 animate-shimmer" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
