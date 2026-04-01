'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, setAuthToken } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const _router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res?.accessToken) {
        setAuthToken(res.accessToken);
        // S21: Use window.location for hard reload to ensure middleware catches the new cookie
        // Redirecting... loading stays true to prevent flicker
        window.location.href = '/dashboard';
      } else {
        throw new Error('Authentication Protocol Failure: No token received');
      }
    } catch (err: any) {
      // S11: Precise Error Surfacing (Zombie UI Prevention)
      const message =
        err instanceof Error ? err.message : 'Critical Authentication Failure';
      setError(message);
      setLoading(false); // Revoke only on failure
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sansSelection">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-2xl bg-indigo-600 p-3 shadow-2xl shadow-indigo-500/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Apex <span className="text-indigo-500">Merchant</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Strategic Platform Administration
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
          <CardHeader className="space-y-1 bg-slate-800/50 pb-8 pt-8">
            <CardTitle className="text-xl font-bold text-white">
              Login Required
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-bold">
              Secure Session Initialization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-black text-slate-500 uppercase ml-1"
                >
                  Mail Protocol
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@60sec.shop"
                    className="bg-slate-950 border-slate-800 focus:border-indigo-500 h-11 pl-10 text-slate-200 placeholder:text-slate-700 font-medium"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-black text-slate-500 uppercase ml-1"
                >
                  Access Key
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    className="bg-slate-950 border-slate-800 focus:border-indigo-500 h-11 pl-10 text-slate-200 font-medium"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 relative group overflow-hidden"
                type="submit"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="relative">Authorize Access</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Sovereign Security Protocols Active
          <br />
          Standardized Merchant Cluster • v4.0.1
        </p>
      </div>
    </div>
  );
}
