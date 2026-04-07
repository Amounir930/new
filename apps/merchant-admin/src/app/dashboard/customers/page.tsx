'use client';

import { ChevronDown, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type CustomerRow,
  CustomerTable,
} from '@/components/customers/customer-table';
import { getCustomers } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'spent_desc', label: 'Highest Spent' },
  { value: 'name_asc', label: 'Name A–Z' },
] as const;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<
    'newest' | 'oldest' | 'spent_desc' | 'name_asc'
  >('newest');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getCustomers({
          page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          sort,
        });
        setCustomers(
          res.customers.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
            createdAt: c.createdAt,
            lastLoginAt: c.lastLoginAt,
            totalOrdersCount: c.totalOrdersCount,
            totalSpentAmount: c.totalSpentAmount,
            isVerified: c.isVerified,
            acceptsMarketing: c.acceptsMarketing,
            avatarUrl: c.avatarUrl,
          }))
        );
        setPagination(res.pagination);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load customers';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, sort, pagination.limit]
  );

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handlePageChange = (page: number) => {
    fetchCustomers(page);
  };

  const handleRowClick = (customerId: string) => {
    // Future: open detail drawer / navigate to /dashboard/customers/:id
    console.log('Customer clicked:', customerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">
            Identity <span className="text-indigo-600">Registry</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination.total} registered customer
            {pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as (typeof SORT_OPTIONS)[number]['value']
                )
              }
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-10 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="mt-4 text-sm text-slate-400">
            Loading customer records…
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchCustomers(pagination.page)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}
