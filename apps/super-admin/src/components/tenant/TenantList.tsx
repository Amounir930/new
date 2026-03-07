'use client';

import { Globe, Loader2, Plus, Search, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { ProvisionModal } from './ProvisionModal';
import { TenantGovernanceModal } from './TenantGovernanceModal';

interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: string;
  status: string;
  nicheType: string;
  createdAt: string;
}

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [governanceTenant, setGovernanceTenant] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const PLANS = ['free', 'basic', 'pro', 'enterprise'];
  const STATUSES = ['active', 'paused', 'suspended'];
  const NICHES = [
    'retail',
    'wellness',
    'education',
    'services',
    'hospitality',
    'real-estate',
    'creative',
  ];

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Tenant[]>('/v1/admin/tenants');
      setTenants(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      (t?.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (t?.subdomain || '').toLowerCase().includes((search || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || t?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function updateTenant(id: string, data: unknown) {
    try {
      setUpdatingId(id);
      await apiFetch(`/v1/admin/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await fetchTenants();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Update failed: ${message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Tenants</CardTitle>
        <Button onClick={() => setIsProvisionModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Provision New
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or subdomain..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full md:w-[200px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        <ProvisionModal
          open={isProvisionModalOpen}
          onOpenChange={setIsProvisionModalOpen}
          onSuccess={fetchTenants}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Subdomain</TableHead>
              <TableHead>Sector (Niche)</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-center">Governance</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tenants found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {tenant.subdomain}.60sec.shop
                  </TableCell>
                  <TableCell>
                    <select
                      className="bg-transparent border-none text-xs capitalize cursor-pointer hover:bg-muted p-1 rounded"
                      value={tenant.nicheType || 'retail'}
                      disabled={updatingId === tenant.id}
                      onChange={(e) =>
                        updateTenant(tenant.id, { nicheType: e.target.value })
                      }
                    >
                      {NICHES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="bg-transparent border-none text-xs uppercase cursor-pointer hover:bg-muted p-1 rounded"
                      value={tenant.plan}
                      disabled={updatingId === tenant.id}
                      onChange={(e) =>
                        updateTenant(tenant.id, { plan: e.target.value })
                      }
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border-none cursor-pointer ${
                        tenant.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      value={tenant.status}
                      disabled={updatingId === tenant.id}
                      onChange={(e) =>
                        updateTenant(tenant.id, { status: e.target.value })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={() =>
                        setGovernanceTenant({
                          id: tenant.id,
                          name: tenant.name,
                        })
                      }
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" /> Governance
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://${tenant.subdomain}.60sec.shop`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {governanceTenant && (
          <TenantGovernanceModal
            tenantId={governanceTenant.id}
            tenantName={governanceTenant.name}
            onClose={() => setGovernanceTenant(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
