'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

const provisionSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Lowercase alphanumeric and hyphens only'),
  adminEmail: z.string().email('Invalid email address'),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']),
  blueprintId: z.string().optional(),
});

type ProvisionFormValues = z.infer<typeof provisionSchema>;

interface Blueprint {
  id: string;
  name: string;
  version: string;
  plan: string;
  status: string;
}

interface ProvisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProvisionModal({
  open,
  onOpenChange,
  onSuccess,
}: ProvisionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      storeName: '',
      subdomain: '',
      adminEmail: '',
      plan: 'free',
    },
  });

  const selectedPlan = watch('plan');

  useEffect(() => {
    async function fetchBlueprints() {
      try {
        const data = await apiFetch('/v1/blueprints');
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
      setError('');
      await apiFetch('/v1/provision', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Provisioning failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Provision New Tenant</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm">
            Create a new 60-second store environment. This process takes about a
            minute.
          </p>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                placeholder="My Awesome Store"
                {...register('storeName')}
              />
              {errors.storeName && (
                <p className="text-destructive text-xs">
                  {errors.storeName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="subdomain"
                  placeholder="my-store"
                  {...register('subdomain')}
                />
                <span className="text-muted-foreground text-sm">
                  .60sec.shop
                </span>
              </div>
              {errors.subdomain && (
                <p className="text-destructive text-xs">
                  {errors.subdomain.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@example.com"
                {...register('adminEmail')}
              />
              {errors.adminEmail && (
                <p className="text-destructive text-xs">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                {...register('plan')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              {errors.plan && (
                <p className="text-destructive text-xs">
                  {errors.plan.message}
                </p>
              )}
            </div>

            {filteredBlueprints.length > 0 && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label htmlFor="blueprintId">
                  Initial Template (Blueprint)
                </Label>
                <select
                  id="blueprintId"
                  {...register('blueprintId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Default (Sector-based)</option>
                  {filteredBlueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (v{b.version})
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-[10px]">
                  Override the default sector logic by picking a named
                  blueprint.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Provisioning...' : 'Start 60s Provisioning'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
