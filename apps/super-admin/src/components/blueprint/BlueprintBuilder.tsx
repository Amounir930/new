'use client';

import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from '.././.././.././.././packages/provisioning/src/blueprint/constants';

const SECTORS = [
  'retail',
  'wellness',
  'professional',
  'food',
  'education',
  'real_estate',
  'events',
];
const PLANS = ['free', 'basic', 'pro', 'enterprise'];

export function BlueprintBuilder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('retail');
  const [plan, setPlan] = useState('free');
  const [isDefault, setIsDefault] = useState(false);

  // 41 Features (Toggles)
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    const initialFeatures: Record<string, boolean> = {};
    for (const feat of MASTER_FEATURE_LIST) {
      initialFeatures[feat] = true;
    }
    return initialFeatures;
  });

  // Quotas (Limits)
  const [quotas, setQuotas] = useState<Record<string, number>>({
    max_products: 50,
    max_orders: 100,
    max_pages: 5,
    storage_limit_gb: 1,
  });

  const handleSave = async () => {
    if (!name) {
      alert('Please enter a blueprint name');
      return;
    }

    try {
      setSaving(true);

      // Generate the strict JSON
      const blueprint = {
        version: '1.0',
        name,
        modules: features,
        quotas,
      };

      const payload = {
        name,
        description,
        nicheType: sector,
        plan,
        isDefault,
        blueprint,
        status: 'active',
      };

      await apiFetch('/v1/admin/blueprints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/dashboard/blueprints');
    } catch (e: unknown) {
      alert(`Save Failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Strict Blueprint Builder
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save 41-Feature Blueprint
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Base System Config */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Base System</CardTitle>
            <CardDescription>Industry & Plan identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Blueprint Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Retail Pro V1"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this blueprint"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry Sector</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target Plan</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label htmlFor="is-default">Set as Sector Default</Label>
            </div>
          </CardContent>
        </Card>

        {/* Quotas & Limits */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resource Quotas</CardTitle>
            <CardDescription>Hard limits for this plan level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {MASTER_QUOTA_LIST.map((quota) => (
                <div key={quota} className="space-y-2">
                  <Label className="capitalize">
                    {quota.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    type="number"
                    value={quotas[quota]}
                    onChange={(e) =>
                      setQuotas({ ...quotas, [quota]: Number(e.target.value) })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>41 Features Master List</CardTitle>
          <CardDescription>
            Enable or disable specific storefront capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>System Mapping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MASTER_FEATURE_LIST.map((feature) => (
                <TableRow key={feature}>
                  <TableCell className="font-mono text-sm">{feature}</TableCell>
                  <TableCell>
                    <Switch
                      checked={features[feature]}
                      onCheckedChange={(val: boolean) =>
                        setFeatures({ ...features, [feature]: val })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase">
                    {features[feature] ? 'ENABLED' : 'DISABLED'}
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
