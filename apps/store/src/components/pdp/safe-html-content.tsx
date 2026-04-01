'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';

interface SafeHtmlContentProps {
  html: string;
  className?: string;
}

/**
 * ── SAFE HTML CONTENT ──
 * Sanitizes HTML content using DOMPurify before rendering
 */
export function SafeHtmlContent({ html, className }: SafeHtmlContentProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    const clean = DOMPurify.sanitize(html);
    setSanitizedHtml(clean);
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
