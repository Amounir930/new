import { TenantList } from '@/components/tenant/TenantList';

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Manage all provisioned stores and their status.
          </p>
        </div>
      </div>
      <TenantList />
    </div>
  );
}
