'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Loader2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { LogoUploader } from '@/components/settings/LogoUploader';

const SettingsSchema = z.object({
  store_name: z.string().min(1, 'Store name is required').max(100),
  logo_url: z.string().url('Invalid logo URL').or(z.literal('')),
});

type SettingsForm = z.infer<typeof SettingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      store_name: '',
      logo_url: '',
    },
  });

  const formValues = watch();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<SettingsForm>('/merchant/config');
        if (data) {
          setValue('store_name', data.store_name);
          setValue('logo_url', data.logo_url);
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [setValue]);

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    try {
      await apiFetch('/merchant/config', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      toast.success('Settings updated successfully', {
        description:
          'Storefront cache has been invalidated for immediate updates.',
      });
    } catch (_error) {
      toast.error('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Store Settings
        </h1>
        <p className="text-slate-500">
          Manage your store's public identity and branding.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="w-5 h-5 text-indigo-600" />
              General Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="store_name" className="font-bold text-slate-700">
                Store Name
              </Label>
              <Input
                id="store_name"
                disabled={saving}
                placeholder="Enter store name"
                className="h-12 border-slate-200 focus:ring-indigo-500"
                {...register('store_name')}
              />
              {errors.store_name && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.store_name.message}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <Label className="font-bold text-slate-700">
                Store Branding (Logo)
              </Label>
              <LogoUploader 
                value={formValues.logo_url} 
                onChange={(url) => setValue('logo_url', url)} 
              />
              <p className="text-xs text-slate-500">
                We recommend a square logo (512x512px) for optimal storefront display. 
                Images are automatically optimized via Imgproxy.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            className="px-12 py-6 bg-indigo-600 hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Identity'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
