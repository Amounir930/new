'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsProvider";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { language } = useSettings();

  const t = {
    en: {
      welcomeBack: "Welcome Back",
      enterEmail: "Enter your email below to login to your account.",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot your password?",
      login: "Login",
      noAccount: "Don't have an account?",
      signUp: "Sign up",
    },
    ar: {
      welcomeBack: "مرحباً بعودتك",
      enterEmail: "أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      login: "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      signUp: "إنشاء حساب",
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t[language].welcomeBack}</CardTitle>
          <CardDescription>
            {t[language].enterEmail}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t[language].email}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">{t[language].password}</Label>
              <Link href="#" className="ms-auto inline-block text-sm underline">
                {t[language].forgotPassword}
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">{t[language].login}</Button>
          <div className="text-center text-sm">
            {t[language].noAccount}{" "}
            <Link href="/signup" className="underline">
              {t[language].signUp}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
