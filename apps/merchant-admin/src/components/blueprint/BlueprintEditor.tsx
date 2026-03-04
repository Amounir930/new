'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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
import { apiFetch } from '@/lib/api';
import { validateBlueprint } from '@/lib/blueprint-validator';
import { JsonEditorWrapper } from './JsonEditorWrapper';

interface BlueprintEditorProps {
  id: string; // 'new' or UUID
}

export function BlueprintEditor({ id }: BlueprintEditorProps) {
  const router = useRouter();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState('free');
  const [isDefault, setIsDefault] = useState(false);
  const [sector, setSector] = useState('retail');
  const [features, setFeatures] = useState({});
  const [quotas, setQuotas] = useState({});
  const [json, setJson] = useState(
    '{\n  "version": "1.0",\n  "name": "Starter Template",\n  "settings": {\n    "site_name": "My Store",\n    "currency": "USD"\n  },\n  "pages": [],\n  "products": []\n}'
  );

  const fetchBlueprint = useCallback(async () => {
    try {
      const data = await apiFetch<any>(`/v1/admin/blueprints/${id}`);
      setName(data.name);
      setDescription(data.description || '');
      setPlan(data.plan);
      setIsDefault(data.isDefault);
      setSector(data.nicheType || 'retail');
      // Ensure blueprint is a string for the editor
      const bpString =
        typeof data.blueprint === 'string'
          ? data.blueprint
          : JSON.stringify(data.blueprint, null, 2);
      setJson(bpString);
    } catch (e: any) {
      alert(`Failed to load: ${e.message}`);
      router.push('/super-admin/blueprints');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isNew) {
      fetchBlueprint();
    }
  }, [isNew, fetchBlueprint]);

  const extractInnerBlueprint = (parsed: any) => {
    let blueprint = parsed;
    if (parsed.blueprint && typeof parsed.blueprint === 'object') {
      if (!name && parsed.name) setName(parsed.name);
      if (!description && parsed.description)
        setDescription(parsed.description);
      if (parsed.plan) setPlan(parsed.plan);
      blueprint = parsed.blueprint;
    }
    return blueprint;
  };

  const processBlueprint = (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    const blueprint = extractInnerBlueprint(parsed);

    if (!validateBlueprint(blueprint)) {
      throw new Error('Invalid blueprint structure');
    }

    return blueprint;
  };

  const submitBlueprint = async (blueprint: unknown) => {
    const payload = { name, description, plan, isDefault, blueprint };
    const method = isNew ? 'POST' : 'PATCH';
    const endpoint = isNew
      ? '/v1/admin/blueprints'
      : `/v1/admin/blueprints/${id}`;

    await apiFetch(endpoint, {
      method,
      body: JSON.stringify(payload),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const blueprint = processBlueprint(json);
      await submitBlueprint(blueprint);
      router.push('/super-admin/blueprints');
    } catch (e: any) {
      alert(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? 'Create Blueprint' : 'Edit Blueprint'}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Basic configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gold Starter"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this blueprint"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <select
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault">Is Default?</Label>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Blueprint
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Blueprint JSON</CardTitle>
            <CardDescription>Define the starter data schema</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden rounded-b-lg">
            <JsonEditorWrapper
              value={json}
              onChange={(v) => setJson(v || '')}
              height="600px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
