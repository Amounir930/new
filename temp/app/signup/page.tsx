'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsProvider";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { language } = useSettings();

  const t = {
    en: {
      createAccount: "Create an account",
      enterInfo: "Enter your information to create a new account.",
      name: "Name",
      email: "Email",
      password: "Password",
      signUp: "Create account",
      haveAccount: "Already have an account?",
      login: "Login",
    },
    ar: {
      createAccount: "إنشاء حساب",
      enterInfo: "أدخل معلوماتك لإنشاء حساب جديد.",
      name: "الاسم",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      signUp: "إنشاء حساب",
      haveAccount: "هل لديك حساب بالفعل؟",
      login: "تسجيل الدخول",
    }
  }


  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t[language].createAccount}</CardTitle>
          <CardDescription>
            {t[language].enterInfo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t[language].name}</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <Label htmlFor="password">{t[language].password}</Label>
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
          <Button className="w-full">{t[language].signUp}</Button>
          <div className="text-center text-sm">
            {t[language].haveAccount}{" "}
            <Link href="/login" className="underline">
              {t[language].login}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
