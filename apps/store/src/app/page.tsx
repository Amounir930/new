import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Root page — only reached when there's no subdomain (direct domain access).
 * Tenants are served via /m/[subdomain]/ (middleware rewrite).
 */
export default async function RootPage() {
  await headers();

  // No subdomain = no tenant context = redirect to main site
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">60sec.shop</h1>
        <p className="text-gray-400">
          Visit your store at{' '}
          <code className="text-blue-400">yourstore.60sec.shop</code>
        </p>
      </div>
    </div>
  );
}
