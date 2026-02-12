'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

// Mock data
const walletData = {
  balance: 55.2,
  transactions: [
    {
      id: 1,
      date: '2024-07-26',
      type: 'Refund',
      amount: 24.99,
      description: 'Order #ORD-12340 refund',
    },
    {
      id: 2,
      date: '2024-07-22',
      type: 'Top-up',
      amount: 50.0,
      description: 'Added funds from Visa **** 4242',
    },
    {
      id: 3,
      date: '2024-07-15',
      type: 'Purchase',
      amount: -19.79,
      description: 'Order #ORD-12343',
    },
  ],
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function WalletPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'My Wallet',
      subtitle: 'Manage your balance and view transactions.',
      topUp: 'Top-up Balance',
      currentBalance: 'Current Balance',
      historyTitle: 'Transaction History',
      historyDesc: 'Your recent wallet activity.',
      date: 'Date',
      type: 'Type',
      description: 'Description',
      amount: 'Amount',
      refund: 'Refund',
      topUpType: 'Top-up',
      purchase: 'Purchase',
    },
    ar: {
      title: 'محفظتي',
      subtitle: 'إدارة رصيدك وعرض المعاملات.',
      topUp: 'شحن الرصيد',
      currentBalance: 'الرصيد الحالي',
      historyTitle: 'سجل المعاملات',
      historyDesc: 'نشاط محفظتك الأخير.',
      date: 'التاريخ',
      type: 'النوع',
      description: 'الوصف',
      amount: 'المبلغ',
      refund: 'استرداد',
      topUpType: 'شحن',
      purchase: 'شراء',
    },
  };

  const getTransactionType = (type: string) => {
    if (language === 'ar') {
      switch (type) {
        case 'Refund':
          return t.ar.refund;
        case 'Top-up':
          return t.ar.topUpType;
        case 'Purchase':
          return t.ar.purchase;
      }
    }
    return type;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t[language].title}
          </h1>
          <p className="mt-1 text-muted-foreground">{t[language].subtitle}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {t[language].topUp}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t[language].currentBalance}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">
            {formatCurrency(walletData.balance)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t[language].historyTitle}</CardTitle>
          <CardDescription>{t[language].historyDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t[language].date}</TableHead>
                <TableHead>{t[language].type}</TableHead>
                <TableHead>{t[language].description}</TableHead>
                <TableHead className="text-right">
                  {t[language].amount}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletData.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${tx.type === 'Purchase' ? '' : 'text-green-600'}`}
                    >
                      {getTransactionType(tx.type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.description}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
