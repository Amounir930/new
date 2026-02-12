/**
 * Theme System - Atomic Matrix
 * Unified design tokens and theme configuration
 */

/**
 * Design Tokens
 * Base values that power the entire design system
 */
export const designTokens = {
  // Spacing scale (based on 4px grid)
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // Typography scale
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;

/**
 * Theme Configuration
 * Runtime theme switching support
 */
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  direction: 'ltr' | 'rtl';
}

/**
 * Get current theme configuration
 */
export function getThemeConfig(): ThemeConfig {
  if (typeof document === 'undefined') {
    return { mode: 'light', direction: 'ltr' };
  }

  const mode = document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';
  const direction = (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr';

  return { mode, direction };
}

/**
 * Set theme mode
 */
export function setThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;

  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Store preference
  localStorage.setItem('theme-mode', mode);
}

/**
 * Set text direction
 */
export function setTextDirection(direction: 'ltr' | 'rtl') {
  if (typeof document === 'undefined') return;

  document.documentElement.dir = direction;
  localStorage.setItem('text-direction', direction);
}

/**
 * Initialize theme from localStorage
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return;

  // Load theme mode
  const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
  if (savedMode) {
    setThemeMode(savedMode);
  }

  // Load text direction
  const savedDirection = localStorage.getItem('text-direction') as
    | 'ltr'
    | 'rtl'
    | null;
  if (savedDirection) {
    setTextDirection(savedDirection);
  }
}

export type DesignTokens = typeof designTokens;
