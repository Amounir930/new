/**
 * Orders Page
 *
 * List of user orders.
 *
 * @route /dashboard/orders
 */

import { formatDate, formatPrice } from '@/lib/formatters';
import Link from 'next/link';

export default function OrdersPage() {
  // TODO: Fetch orders from API
  const orders: any[] = [];

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-600 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div
            key={order.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                {order.items.length} item(s)
              </p>
              <p className="font-bold text-lg">
                {formatPrice(order.total, order.currency)}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-primary hover:underline text-sm"
              >
                View Details
              </Link>
              <Link
                href={`/track-order?id=${order.id}`}
                className="text-primary hover:underline text-sm"
              >
                Track Order
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
