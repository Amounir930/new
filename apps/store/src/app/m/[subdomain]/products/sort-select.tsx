'use client';

import { useRouter } from 'next/navigation';

interface SortSelectProps {
  currentSort: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter();

  return (
    <select
      id="sort-select"
      value={currentSort}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', e.target.value);
        router.push(url.toString());
      }}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
