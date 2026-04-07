'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Settings,
  Store,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  storefrontUrl: string;
  adminUrl: string;
  email: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  storeName,
  storefrontUrl,
  adminUrl,
  email,
}: SuccessModalProps) {
  const [copiedField, setCopiedField] = useState<'storefront' | 'admin' | null>(
    null
  );

  if (!isOpen) return null;

  const handleCopy = async (url: string, field: 'storefront' | 'admin') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Store Created!
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Congratulations! Your store{' '}
              <strong className="text-white">{storeName}</strong> is now live.
              We&apos;ve sent the details to{' '}
              <strong className="text-white">{email}</strong>.
            </p>
          </div>

          {/* Storefront URL Block */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                Public Storefront URL
              </p>
            </div>
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
              <p className="text-blue-400 font-mono text-sm break-all mr-4">
                {storefrontUrl}
              </p>
              <button
                onClick={() => handleCopy(storefrontUrl, 'storefront')}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
                title="Copy URL"
              >
                {copiedField === 'storefront' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium py-2.5 rounded-lg flex items-center justify-center transition text-sm"
            >
              Visit Your Store
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>

          {/* Admin URL Block */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                Admin Dashboard URL
              </p>
            </div>
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
              <p className="text-emerald-400 font-mono text-sm break-all mr-4">
                {adminUrl}
              </p>
              <button
                onClick={() => handleCopy(adminUrl, 'admin')}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
                title="Copy URL"
              >
                {copiedField === 'admin' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-medium py-2.5 rounded-lg flex items-center justify-center transition text-sm"
            >
              Go to Admin Dashboard
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>

          {/* Close CTA */}
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-lg transition"
          >
            Get Started
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
