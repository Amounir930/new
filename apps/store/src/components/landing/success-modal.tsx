'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  adminUrl: string;
  email: string;
}

export function SuccessModal({ isOpen, onClose, storeName, adminUrl, email }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Store Created!</h2>
            <p className="text-gray-400 text-sm mb-8">
              Congratulations! Your store <strong>{storeName}</strong> is now live. We've sent the details to <strong>{email}</strong>.
            </p>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wider">Admin Dashboard URL</p>
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
              <p className="text-emerald-400 font-mono text-sm truncate mr-4">{adminUrl}</p>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
                title="Copy URL"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg flex items-center justify-center transition"
          >
            Go to Admin Dashboard
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
