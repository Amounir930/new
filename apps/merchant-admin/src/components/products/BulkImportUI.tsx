'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface RowError {
  row: number;
  sku?: string;
  errors: { field: string; message: string }[];
}

interface ImportStatus {
  status?: string;
  progress?: number;
  totalRows?: number;
  successRows?: number;
  errorRows?: number;
  errors?: RowError[];
  cause?: string;
}

export default function BulkImportUI() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = ['.xlsx', '.zip'];
    const fileName = selectedFile.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      toast.error('Invalid file format. Please select an .xlsx or .zip template.');
      e.target.value = ''; // Reset input so user can re-select
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const downloadTemplate = async () => {
    try {
      const blob = await apiFetch<Blob>('/merchant/products/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed:', err);
      toast.error('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiFetch<Blob>('/merchant/products/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export products');
    }
  };

  const startImport = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiFetch<{ jobId: string }>('/merchant/products/import', {
        method: 'POST',
        body: formData,
        // When using FormData with fetch, do NOT set Content-Type header.
        // apiFetch only sets 'application/json' if it's not already overridden.
        // But we need to make sure apiFetch doesn't force json if it's FormData.
        headers: {}, 
      });

      setJobId(data.jobId);
      toast.success('Import started successfully');
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<ImportStatus>(`/merchant/products/import/${jobId}`);
        
        // Sync importedCount (backend) to successRows (frontend)
        // and errors.length to errorRows
        const updatedStatus: ImportStatus = {
          ...data,
          successRows: (data as any).importedCount ?? data.successRows ?? 0,
          errorRows: data.errors?.length ?? data.errorRows ?? 0,
        };

        setStatus(updatedStatus);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (_err) {
        /* 'Polling failed' */
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
            Download the Excel template, fill it out, and upload to import products in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Template Button */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </Button>
            <p className="text-xs text-gray-500">
              <FileSpreadsheet className="h-3 w-3 inline mr-1" />
              Please use the provided template. Exported CSV files cannot be re-imported.
            </p>
          </div>

          {/* File Upload */}
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .zip, application/zip"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Starting...' : 'Start Import'}
            </Button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 mt-2">
            Accepted formats: <strong>.xlsx</strong> (Excel) or <strong>.zip</strong> (compressed template)
          </p>

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

              {/* 🛡️ Live Error Inspector (Max 100) */}
              {status.errors && status.errors.length > 0 && (
                <div className="mt-6 border-t border-red-100 pt-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-4 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-bold">Error Report ({status.errors.length} issues)</h3>
                  </div>
                  
                  <div className="bg-red-50/50 rounded-xl border border-red-100 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-red-100 custom-scrollbar">
                      {status.errors.slice(0, 100).map((err, idx) => (
                        <div key={idx} className="p-3 hover:bg-red-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                              ROW {err.row}
                            </span>
                            <div className="flex-1 space-y-1">
                              {err.sku && (
                                <p className="text-[10px] font-mono text-red-500 uppercase tracking-tight">
                                  SKU: {err.sku}
                                </p>
                              )}
                              <ul className="space-y-1">
                                {err.errors.map((e, eIdx) => (
                                  <li key={eIdx} className="text-sm text-red-900 leading-tight">
                                    <span className="font-semibold text-red-700 capitalize">
                                      {e.field.replace(/([A-Z])/g, ' $1')}:
                                    </span>{' '}
                                    {e.message}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {status.errors.length > 100 && (
                        <div className="p-4 bg-red-100/50 text-center">
                          <p className="text-sm text-red-700 font-medium">
                            ...and {status.errors.length - 100} more errors. 
                            <br />
                            Please fix the above and re-upload.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ℹ️ General Failure Cause */}
              {status.status === 'failed' && status.cause && !status.errors?.length && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Import Job Errored</p>
                    <p className="text-sm text-red-700 font-medium">{status.cause}</p>
                  </div>
                </div>
              )}
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
            onClick={handleExport}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All to CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
