import Link from 'next/link';
import { TokenInput } from '@/components/auth/TokenInput';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="border-b bg-white dark:bg-gray-800 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-8">
                    <Link href="/super-admin" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Apex Admin
                    </Link>
                    <div className="flex gap-4 text-sm font-medium">
                        <Link href="/super-admin/blueprints" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                            Blueprints
                        </Link>
                        <Link href="/super-admin/tenants" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                            Tenants
                        </Link>
                    </div>
                </div>
                <div>
                    <TokenInput />
                </div>
            </nav>
            <main className="p-8 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
