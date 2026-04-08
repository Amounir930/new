/**
 * Tenant Theme Utilities
 * Converts tenant config into CSS variables and RTL support
 */

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  rtlEnabled: boolean;
}

/**
 * Generate CSS custom properties from tenant theme config
 */
export function generateThemeCSS(theme: TenantTheme): string {
  const { primaryColor, secondaryColor, fontFamily } = theme;

  return `
    :root {
      --primary: ${primaryColor};
      --primary-rgb: ${hexToRgb(primaryColor)};
      --secondary: ${secondaryColor};
      --secondary-rgb: ${hexToRgb(secondaryColor)};
      --font-family: '${fontFamily}', ui-sans-serif, system-ui, -apple-system, sans-serif;
    }

    /* Dynamic color utilities */
    .bg-primary { background-color: var(--primary) !important; }
    .text-primary { color: var(--primary) !important; }
    .border-primary { border-color: var(--primary) !important; }
    .hover\\:text-primary:hover { color: var(--primary) !important; }
    .hover\\:bg-primary:hover { background-color: var(--primary) !important; }
    
    .bg-secondary { background-color: var(--secondary) !important; }
    .text-secondary { color: var(--secondary) !important; }
    .border-secondary { border-color: var(--secondary) !important; }
    
    /* Gradient support */
    .bg-gradient-primary {
      background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    }
    .from-primary-to-secondary {
      --tw-gradient-from: var(--primary);
      --tw-gradient-to: var(--secondary);
    }
    
    /* Font family */
    body, .font-sans {
      font-family: var(--font-family) !important;
    }
  `;
}

/**
 * Generate Google Fonts link for tenant
 */
export function getGoogleFontURL(fontFamily: string): string | null {
  if (!fontFamily || fontFamily === 'Inter') return null;
  
  const fonts = new Set([fontFamily]);
  
  // Add Inter as fallback if different font
  if (fontFamily !== 'Inter') {
    fonts.add('Inter');
  }
  
  const params = Array.from(fonts).map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`);
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

/**
 * Generate RTL-specific CSS
 */
export function generateRTLCSS(): string {
  return `
    /* RTL Support */
    [dir="rtl"] {
      direction: rtl;
      text-align: right;
    }
    
    [dir="rtl"] .space-x-1 > * + * {
      margin-left: 0;
      margin-right: 0.25rem;
    }
    [dir="rtl"] .space-x-2 > * + * {
      margin-left: 0;
      margin-right: 0.5rem;
    }
    [dir="rtl"] .space-x-3 > * + * {
      margin-left: 0;
      margin-right: 0.75rem;
    }
    [dir="rtl"] .space-x-4 > * + * {
      margin-left: 0;
      margin-right: 1rem;
    }
    [dir="rtl"] .space-x-6 > * + * {
      margin-left: 0;
      margin-right: 1.5rem;
    }
    [dir="rtl"] .space-x-8 > * + * {
      margin-left: 0;
      margin-right: 2rem;
    }
    
    /* Flip margins for RTL */
    [dir="rtl"] .ml-auto {
      margin-left: 0;
      margin-right: auto;
    }
    [dir="rtl"] .mr-auto {
      margin-right: 0;
      margin-left: auto;
    }
  `;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Sanitize color input to prevent injection
 */
export function sanitizeColor(color: string | undefined): string {
  if (!color) return '#000000';
  
  // Only allow hex colors and rgb
  const hexMatch = /^#[0-9A-Fa-f]{6}$/.test(color);
  const rgbMatch = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(color);
  
  if (hexMatch || rgbMatch) {
    return color;
  }
  
  return '#000000';
}
