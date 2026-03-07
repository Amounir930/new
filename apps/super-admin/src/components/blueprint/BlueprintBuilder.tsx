'use client';

import {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from '@apex/provisioning/client';
import {
  ArrowLeft,
  BarChart3,
  Globe,
  LayoutGrid,
  Loader2,
  Package,
  Save,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
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

const SECTORS = [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real-estate',
  'creative',
];

const PLANS = ['free', 'basic', 'pro', 'enterprise'];

/**
 * Plan-based Governance Presets
 */
const PLAN_PRESETS: Record<
  string,
  { features: string[]; quotas: Record<string, number> }
> = {
  free: {
    features: [
      'home',
      'search',
      'pdp',
      'cart',
      'checkout',
      'login',
      'register',
      'accountDashboard',
      'myOrders',
      'aboutUs',
      'contactUs',
    ],
    quotas: {
      max_products: 50,
      max_orders: 100,
      max_pages: 5,
      max_staff: 2,
      max_categories: 10,
      max_coupons: 0,
      storage_limit_gb: 1,
      api_rate_limit: 100,
    },
  },
  basic: {
    features: [
      'home',
      'search',
      'pdp',
      'cart',
      'checkout',
      'login',
      'register',
      'accountDashboard',
      'myOrders',
      'category',
      'flashDeals',
      'aboutUs',
      'contactUs',
      'faq',
      'newsletter',
      'productReviews',
      'wishlist',
    ],
    quotas: {
      max_products: 500,
      max_orders: 1000,
      max_pages: 20,
      max_staff: 5,
      max_categories: 50,
      max_coupons: 10,
      storage_limit_gb: 10,
      api_rate_limit: 500,
    },
  },
  pro: {
    features: [...MASTER_FEATURE_LIST].filter(
      (f) => !['b2b', 'apiAccess', 'pos'].includes(f)
    ),
    quotas: {
      max_products: 10000,
      max_orders: 50000,
      max_pages: 100,
      max_staff: 20,
      max_categories: 200,
      max_coupons: 100,
      storage_limit_gb: 100,
      api_rate_limit: 2000,
    },
  },
  enterprise: {
    features: [...MASTER_FEATURE_LIST],
    quotas: {
      max_products: 1000000,
      max_orders: 1000000,
      max_pages: 1000,
      max_staff: 1000,
      max_categories: 1000,
      max_coupons: 1000,
      storage_limit_gb: 1000,
      api_rate_limit: 10000,
    },
  },
};

/**
 * Feature Grouping for UI
 */
const FEATURE_GROUPS = [
  {
    id: 'core',
    name: 'Core Storefront',
    icon: <Globe className="w-4 h-4" />,
    items: [
      'home',
      'search',
      'pdp',
      'cart',
      'checkout',
      'orderSuccess',
      'paymentFailed',
      'category',
      'notFound',
      'maintenanceMode',
    ],
  },
  {
    id: 'catalog',
    name: 'Catalog & Inventory',
    icon: <Package className="w-4 h-4" />,
    items: [
      'quickView',
      'compare',
      'productReviews',
      'brands',
      'smartCollections',
      'variants',
      'inventory',
      'smartFilters',
    ],
  },
  {
    id: 'customer',
    name: 'Customer Identity',
    icon: <ShieldCheck className="w-4 h-4" />,
    items: [
      'login',
      'register',
      'accountDashboard',
      'myOrders',
      'orderDetails',
      'trackOrder',
      'addresses',
      'paymentMethods',
      'wishlist',
      'wallet',
      'loyalty',
      'referral',
      'notifications',
    ],
  },
  {
    id: 'marketing',
    name: 'Growth & Marketing',
    icon: <Zap className="w-4 h-4" />,
    items: ['flashDeals', 'newsletter', 'coupons', 'analytics', 'seo'],
  },
  {
    id: 'content',
    name: 'Content & CMS',
    icon: <LayoutGrid className="w-4 h-4" />,
    items: [
      'aboutUs',
      'contactUs',
      'faq',
      'blog',
      'privacyPolicy',
      'termsConditions',
      'refundPolicy',
      'multilingual',
      'multicurrency',
    ],
  },
  {
    id: 'advanced',
    name: 'B2B & Enterprise',
    icon: <Settings className="w-4 h-4" />,
    items: ['apiAccess', 'pos', 'b2b', 'metafields'],
  },
];

export function BlueprintBuilder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('retail');
  const [plan, setPlan] = useState('free');
  const [isDefault, setIsDefault] = useState(false);

  // Features
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const f of MASTER_FEATURE_LIST) {
      initial[f] = PLAN_PRESETS.free.features.includes(f);
    }
    return initial;
  });

  // Quotas
  const [quotas, setQuotas] = useState<Record<string, number>>(() => ({
    ...PLAN_PRESETS.free.quotas,
  }));

  const applyPreset = (selectedPlan: string) => {
    setPlan(selectedPlan);
    const preset = PLAN_PRESETS[selectedPlan];
    if (preset) {
      const newFeatures: Record<string, boolean> = {};
      for (const f of MASTER_FEATURE_LIST) {
        newFeatures[f] = preset.features.includes(f);
      }
      setFeatures(newFeatures);
      setQuotas({ ...preset.quotas });
    }
  };

  const handleSave = async () => {
    if (!name) {
      alert('Please enter a blueprint name');
      return;
    }

    try {
      setSaving(true);

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
        uiConfig: {},
      };

      await apiFetch('/v1/admin/blueprints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/dashboard/blueprints');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Save Failed: ${message}`);
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
            Governance Blueprint Builder
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Governance Blueprint
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Governance Config */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Governance & Metadata
            </CardTitle>
            <CardDescription>Industry & Plan Enforcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Blueprint Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Retail Enterprise Gold"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Business justification for this blueprint"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry Sector (Niche)</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Governance Plan Tier</Label>
              <select
                className="w-full p-2 border rounded-md bg-primary/10 font-bold"
                value={plan}
                onChange={(e) => applyPreset(e.target.value)}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground italic">
                Changing plan tier resets features and quotas to defaults.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label
                htmlFor="is-default"
                className="font-semibold text-primary"
              >
                Set as Global Sector Default
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Quotas & Capacity */}
        <Card className="md:col-span-2 border-orange-500/20 shadow-sm">
          <CardHeader className="bg-orange-500/5">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              Resource Quotas (Governance)
            </CardTitle>
            <CardDescription>Hard system limits for this tier</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {MASTER_QUOTA_LIST.map((quota) => (
                <div key={quota} className="space-y-2">
                  <Label className="capitalize text-xs font-mono">
                    {quota.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    type="number"
                    value={quotas[quota]}
                    onChange={(e) =>
                      setQuotas({ ...quotas, [quota]: Number(e.target.value) })
                    }
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Matrix */}
      <div className="grid gap-6">
        {FEATURE_GROUPS.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {group.icon}
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px]">Feature Key</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Enabled
                    </TableHead>
                    <TableHead>System Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((feature) => (
                    <TableRow key={feature}>
                      <TableCell className="font-medium font-mono text-sm">
                        {feature}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={features[feature]}
                          onCheckedChange={(val: boolean) =>
                            setFeatures({ ...features, [feature]: val })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${features[feature] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {features[feature]
                            ? 'ACTIVE IN STOREFRONT'
                            : 'BLOCKED BY GOVERNANCE'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
