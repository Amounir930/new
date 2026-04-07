'use client';

export interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  totalOrdersCount: number;
  totalSpentAmount: string;
  isVerified: boolean;
  acceptsMarketing: boolean;
  avatarUrl: string | null;
}

interface CustomerTableProps {
  customers: CustomerRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onRowClick?: (customerId: string) => void;
}

export function CustomerTable({
  customers,
  pagination,
  onPageChange,
  onRowClick,
}: CustomerTableProps) {
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Name
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length > 0 ? (
              customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onRowClick?.(c.id)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.firstName.charAt(0).toUpperCase() ||
                          c.lastName.charAt(0).toUpperCase() ||
                          '?'}
                      </div>
                      <span className="font-medium text-slate-900">
                        {c.firstName} {c.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {c.phone || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      {c.totalOrdersCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-600">
                      ${Number.parseFloat(c.totalSpentAmount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <title>Verified</title>
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-slate-400"
                >
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {pagination.total}
            </span>{' '}
            customer{pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500 px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
