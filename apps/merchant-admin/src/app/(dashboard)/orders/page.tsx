'use client';

import { Download, Eye, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  // Mock data for Admin-17
  useEffect(() => {
    setOrders([
      {
        id: 'ORD001',
        customer: 'Ahmed Zaki',
        total: '$145.00',
        status: 'shipped',
        date: '2026-02-22',
      },
      {
        id: 'ORD002',
        customer: 'Sara Mohamed',
        total: '$230.50',
        status: 'processing',
        date: '2026-02-21',
      },
      {
        id: 'ORD003',
        customer: 'Guest User',
        total: '$89.99',
        status: 'pending',
        date: '2026-02-21',
      },
    ]);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-500">
            Manage customer transactions and shipping.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 transition-all">
            New Manual Order
          </Button>
        </div>
      </header>

      <Card className="border-none shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold py-6 px-6">Order ID</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Total</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-bold text-slate-900 py-6 px-6">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {order.customer}
                  </TableCell>
                  <TableCell className="text-slate-500">{order.date}</TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {order.total}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                        order.status === 'shipped'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {order.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Print Invoice">
                        <Printer className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
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
