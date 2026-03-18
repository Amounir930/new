'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Production-Grade Logo Uploader
 * Orchestrates: Request Signed URL -> Direct Binary Upload -> State Sync
 */
export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // S12 Guard: Limit file size to 2MB on client-side
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Request Pre-signed URL using server-side extension derivation
      // Only the Content-Type is sent; the Server determines the safe extension.
      const { uploadUrl, publicUrl } = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
        `/merchant/upload-url?contentType=${encodeURIComponent(file.type)}`
      );

      // Step 2: Direct Binary Upload to MinIO/S3
      // MANDATORY: Content-Type header MUST match the signature generated on the server
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload Failed: ${response.statusText}`);
      }

      // Step 3: Synchronize State with the public Imgproxy-ready URL
      onChange(publicUrl);
      toast.success('Logo uploaded and synchronized successfully.');
    } catch (error) {
      console.error('[UPLOAD_ERROR]', error);
      toast.error('Failed to upload logo. Please ensure the file is a valid image.');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="space-y-4 w-full">
      <div 
        {...getRootProps()} 
        className={`relative cursor-pointer group rounded-xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center gap-4 
          ${isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-bold text-slate-600">Uploading binary...</p>
          </div>
        ) : value ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-100 shadow-inner group-hover:opacity-75 transition-opacity">
            <img 
              src={value} 
              alt="Store logo preview" 
              className="w-full h-full object-contain bg-white" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
              Replace Logo
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Click to upload brand logo</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP or SVG (Max 2MB)</p>
            </div>
          </div>
        )}
      </div>
      
      {value && (
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 mx-auto transition-colors"
        >
          <X className="w-3 h-3" /> Remove Logo
        </button>
      )}
    </div>
  );
}
