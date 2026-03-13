'use client';

import { AlertCircle, Check, Loader2, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface TenantGovernanceModalProps {
  tenantId: string | null;
  tenantName: string;
  onClose: () => void;
}

interface FeatureState {
  enabled: boolean;
  source: 'plan' | 'tenant';
}

interface FeatureItemProps {
  featureKey: string;
  state: FeatureState;
  saving: boolean;
  onToggle: () => void;
}

function FeatureItem({
  featureKey,
  state,
  saving,
  onToggle,
}: FeatureItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
        state.enabled
          ? 'border-primary/20 bg-primary/[0.02]'
          : 'bg-muted/30 grayscale-[0.5]'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm capitalize">{featureKey}</span>
          {state.source === 'tenant' && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider">
              Override
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          {state.source === 'plan'
            ? 'Inherited from plan'
            : 'Custom override active'}
        </p>
      </div>

      <Button
        size="sm"
        variant={state.enabled ? 'default' : 'outline'}
        className={`h-8 w-24 transition-all ${
          state.enabled ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-muted'
        }`}
        onClick={onToggle}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : state.enabled ? (
          <span className="flex items-center">
            <Check className="mr-1 h-3 w-3" /> Active
          </span>
        ) : (
          'Suspended'
        )}
      </Button>
    </div>
  );
}

export function TenantGovernanceModal({
  tenantId,
  tenantName,
  onClose,
}: TenantGovernanceModalProps) {
  const [features, setFeatures] = useState<Record<string, FeatureState>>({});
  const [tenantMeta, setTenantMeta] = useState<{
    plan: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [metaSaving, setMetaSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!tenantId) return;
      try {
        setLoading(true);
        // Fetch Features Matrix
        const featuresData = await apiFetch<Record<string, FeatureState>>(
          `/tenants/${tenantId}/features`
        );
        setFeatures(featuresData);

        // Fetch Tenant Metadata (Plan/Status)
        // We'll get this from the general tenants list or a specific endpoint
        const tenants = await apiFetch<any[]>('/tenants');
        const current = tenants.find((t) => t.id === tenantId);
        if (current) {
          setTenantMeta({
            plan: current.plan,
            status: current.isActive ? 'active' : 'suspended',
          });
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to fetch governance data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tenantId]);

  async function updateMetadata() {
    if (!tenantId || !tenantMeta) return;
    try {
      setMetaSaving(true);
      await apiFetch(`/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: tenantMeta.plan,
          status: tenantMeta.status,
        }),
      });
      alert('Sovereign Update Successful: Tenant metadata synchronized.');
    } catch (e: unknown) {
      alert(`Update Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMetaSaving(false);
    }
  }

  async function toggleFeature(key: string, currentState: boolean) {
    if (!tenantId) return;
    try {
      setSaving(key);
      const newState = !currentState;
      await apiFetch(`/tenants/${tenantId}/features/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: newState }),
      });

      setFeatures((prev) => ({
        ...prev,
        [key]: { enabled: newState, source: 'tenant' },
      }));
    } catch (e: unknown) {
      alert(
        `Failed to update feature: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setSaving(null);
    }
  }

  if (!tenantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-primary/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Governance Control
              </h2>
              <p className="text-muted-foreground text-sm">
                Managing features for{' '}
                <span className="text-foreground font-semibold underline decoration-primary/30">
                  {tenantName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">
                Loading governance matrix...
              </p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center space-x-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sovereign Metadata Controls */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center">
                  <Shield className="w-3 h-3 mr-2 text-indigo-400" />
                  Sovereign Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Subscription Plan
                    </label>
                    <select
                      value={tenantMeta?.plan || ''}
                      onChange={(e) =>
                        setTenantMeta((prev) =>
                          prev ? { ...prev, plan: e.target.value } : null
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Governance Status
                    </label>
                    <select
                      value={tenantMeta?.status || ''}
                      onChange={(e) =>
                        setTenantMeta((prev) =>
                          prev ? { ...prev, status: e.target.value } : null
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={updateMetadata}
                  disabled={metaSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 rounded-lg font-bold text-xs"
                >
                  {metaSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Synchronize Governance State'
                  )}
                </Button>
              </div>

              {/* Feature Matrix */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center">
                  <Shield className="w-3 h-3 mr-2 text-amber-400" />
                  Feature Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(features)
                    .sort()
                    .map(([key, state]) => (
                      <FeatureItem
                        key={key}
                        featureKey={key}
                        state={state}
                        saving={saving === key}
                        onToggle={() => toggleFeature(key, state.enabled)}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
