'use client';

import React, { useMemo } from 'react';
import { v3Resolver, v3HomeTemplate } from '@apex/template-engine';
import { BrickRenderer } from '@/components/layout/BrickRenderer';
import { useSettings } from '@/contexts/SettingsProvider';

/**
 * 🏠 LEGO-Modular Home Page (v3)
 * Following S1 (Standard Setup) & S8 (Structural Integrity)
 * Zero hardcoded content. 100% Schema-driven.
 */
export default function Home() {
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // 1. Prepare Data Context (Mocked for now, following S1)
  const context = useMemo(() => ({
    data: {
      store: {
        name: isRTL ? 'متجر أديل' : 'Adel Store',
      },
      flash_deals: {
        active: true,
      },
      user: {
        name: 'Guest',
      }
    },
    locale: language,
    isRTL,
    builderMode: false,
  }), [language, isRTL]);

  // 2. Resolve the hierarchical blueprint
  const resolvedBlueprint = useMemo(() =>
    v3Resolver.resolveBlueprint(v3HomeTemplate, context),
    [context]);

  return (
    <div className="flex flex-col min-h-screen">
      <BrickRenderer brick={resolvedBlueprint} />
    </div>
  );
}
