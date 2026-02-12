'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { language } = useSettings();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const t = {
    en: {
      title: 'Contact Us',
      subtitle: "We'd love to hear from you.",
      getInTouch: 'Get in Touch',
      email: 'Email',
      emailDesc: 'Drop us a line anytime!',
      phone: 'Phone',
      phoneDesc: 'Mon-Fri from 9am to 5pm.',
      office: 'Our Office',
      officeAddress: '123 Fashion Ave, New York, NY 10001',
      sendMessage: 'Send a Message',
      yourName: 'Your Name',
      yourEmail: 'Your Email',
      subject: 'Subject',
      yourMessage: 'Your Message',
      submit: 'Send Message',
      messageSent: 'Message Sent!',
      messageSentDesc: "Thanks for reaching out. We'll get back to you soon.",
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'يسعدنا أن نسمع منك.',
      getInTouch: 'تواصل معنا',
      email: 'البريد الإلكتروني',
      emailDesc: 'راسلنا في أي وقت!',
      phone: 'الهاتف',
      phoneDesc: 'من الإثنين إلى الجمعة من 9 صباحًا حتى 5 مساءً.',
      office: 'مكتبنا',
      officeAddress: '123 شارع الموضة، نيويورك، نيويورك 10001',
      sendMessage: 'أرسل رسالة',
      yourName: 'اسمك',
      yourEmail: 'بريدك الإلكتروني',
      subject: 'الموضوع',
      yourMessage: 'رسالتك',
      submit: 'إرسال الرسالة',
      messageSent: 'تم إرسال الرسالة!',
      messageSentDesc: 'شكراً لتواصلك معنا. سنرد عليك قريباً.',
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to a server
    toast({
      title: t[language].messageSent,
      description: t[language].messageSentDesc,
    });
    // Reset form
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t[language].getInTouch}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t[language].email}</h3>
                  <p className="text-muted-foreground">
                    {t[language].emailDesc}
                  </p>
                  <a
                    href="mailto:support@stylegrove.com"
                    className="text-primary hover:underline"
                  >
                    support@stylegrove.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t[language].phone}</h3>
                  <p className="text-muted-foreground">
                    {t[language].phoneDesc}
                  </p>
                  <a
                    href="tel:+1234567890"
                    className="text-primary hover:underline"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t[language].office}</h3>
                  <p className="text-muted-foreground">
                    {t[language].officeAddress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t[language].sendMessage}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    placeholder={t[language].yourName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder={t[language].yourEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Input
                  placeholder={t[language].subject}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <Textarea
                  placeholder={t[language].yourMessage}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  {t[language].submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
