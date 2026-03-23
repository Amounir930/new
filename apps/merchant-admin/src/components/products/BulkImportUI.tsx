'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
import { apiFetch } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function BulkImportUI() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    status?: string;
    progress?: number;
    totalRows?: number;
    successRows?: number;
    errorRows?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const startImport = async () => {
    if (!file) return;
    setLoading(true);

    // Read file as base64 for simplicity in this demo (S8: Secure Upload)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      try {
        const data = await apiFetch<{ jobId: string }>('/merchant/products/import', {
          method: 'POST',
          body: JSON.stringify({ fileData: base64 }),
        });
        setJobId(data.jobId);
      } catch (_err) {
        /* 'Import failed', err */
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<{
          status?: string;
          progress?: number;
          totalRows?: number;
          successRows?: number;
          errorRows?: number;
        }>(`/merchant/products/import/${jobId}`);
        setStatus(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (_err) {
        /* 'Polling failed', err */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="space-y-6 p-6">
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Bulk Product Import
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import products in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-xs border-2 border-dashed border-gray-200 p-2 h-auto"
            />
            <Button
              onClick={startImport}
              disabled={
                !file ||
                loading ||
                (jobId !== null && status?.status !== 'completed')
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg"
            >
              {loading ? 'Starting...' : 'Start Import'}
            </Button>
          </div>

          {status && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>
                  Status:{' '}
                  <span className="uppercase text-indigo-600">
                    {status.status}
                  </span>
                </span>
                <span>{status.progress ?? 0}% Complete</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${status.progress || 0}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase font-bold">
                    Total
                  </p>
                  <p className="text-2xl font-black text-blue-900">
                    {status.totalRows || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-xs text-green-600 uppercase font-bold">
                    Success
                  </p>
                  <p className="text-2xl font-black text-green-900">
                    {status.successRows || 0}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-xs text-red-600 uppercase font-bold">
                    Errors
                  </p>
                  <p className="text-2xl font-black text-red-900">
                    {status.errorRows ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Product Export</CardTitle>
          <CardDescription>
            Download all current products in CSV format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.open(`${config.apiUrl}/merchant/products/export`, '_blank')}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            Export All to CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
