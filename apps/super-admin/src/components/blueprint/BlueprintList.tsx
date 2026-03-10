'use client';

import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

interface Blueprint {
  id: string;
  name: string;
  plan: string;
  isDefault: boolean;
  createdAt: string;
}

export function BlueprintList() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlueprints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Blueprint[]>('/v1/blueprints');
      setBlueprints(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  const handleDelete = async (id: string) => {
    // eslint-ignore no-restricted-globals
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    try {
      await apiFetch(`/v1/blueprints/${id}`, { method: 'DELETE' });
      fetchBlueprints();
      fetchBlueprints();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

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
        <CardTitle>Onboarding Blueprints</CardTitle>
        <Link href="/dashboard/blueprints/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blueprints.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No blueprints found.
                </TableCell>
              </TableRow>
            ) : (
              blueprints.map((bp) => (
                <TableRow key={bp.id}>
                  <TableCell className="font-medium">{bp.name}</TableCell>
                  <TableCell className="uppercase">{bp.plan}</TableCell>
                  <TableCell>
                    {bp.isDefault ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Default
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(bp.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/dashboard/blueprints/${bp.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(bp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
