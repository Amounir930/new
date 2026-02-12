/**
 * RTL-Aware Animation Utilities
 * Ensures directional animations work correctly in both LTR and RTL layouts
 */

import { cn } from '../core/utils';
// Note: cn is imported from core/utils to avoid ambiguous exports

/**
 * RTL Direction Hook
 * Detects document direction for animation adjustments
 */
export function useRTL() {
  if (typeof document !== 'undefined') {
    return (
      document.documentElement.dir === 'rtl' ||
      document.documentElement.lang === 'ar'
    );
  }
  return false;
}

/**
 * RTL-Aware Animation Classes
 * Maps logical directions to physical directions based on layout direction
 */
export const rtlAnimations = {
  // Slide animations
  slideInStart:
    'data-[state=open]:slide-in-from-left rtl:data-[state=open]:slide-in-from-right',
  slideInEnd:
    'data-[state=open]:slide-in-from-right rtl:data-[state=open]:slide-in-from-left',
  slideOutStart:
    'data-[state=closed]:slide-out-to-left rtl:data-[state=closed]:slide-out-to-right',
  slideOutEnd:
    'data-[state=closed]:slide-out-to-right rtl:data-[state=closed]:slide-out-to-left',

  // Fade with direction
  fadeSlideInStart:
    'animate-in fade-in slide-in-from-left-4 rtl:slide-in-from-right-4',
  fadeSlideInEnd:
    'animate-in fade-in slide-in-from-right-4 rtl:slide-in-from-left-4',

  // Transform origins
  transformOriginStart: 'origin-left rtl:origin-right',
  transformOriginEnd: 'origin-right rtl:origin-left',
};

/**
 * Get directional class based on RTL
 * @param ltrClass - Class for LTR layout
 * @param rtlClass - Class for RTL layout
 * @returns Appropriate class based on current direction
 */
export function getDirectionalClass(
  ltrClass: string,
  rtlClass: string
): string {
  const isRTL = useRTL();
  return isRTL ? rtlClass : ltrClass;
}

/**
 * Directional positioning utilities
 */
export const rtlPositioning = {
  start: 'left-0 rtl:left-auto rtl:right-0',
  end: 'right-0 rtl:right-auto rtl:left-0',
  paddingStart: 'pl-4 rtl:pl-0 rtl:pr-4',
  paddingEnd: 'pr-4 rtl:pr-0 rtl:pl-4',
  marginStart: 'ml-4 rtl:ml-0 rtl:mr-4',
  marginEnd: 'mr-4 rtl:mr-0 rtl:ml-4',
};
