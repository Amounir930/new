import React from 'react';
import { cn } from '@/lib/utils';

interface SectionV3Props {
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: string;
  slots?: {
    children?: React.ReactNode;
  };
  className?: string;
}

const paddingMap = {
  none: 'py-0',
  small: 'py-8 md:py-12',
  medium: 'py-16 md:py-24',
  large: 'py-24 md:py-32',
};

export default function SectionV3({
  padding = 'medium',
  background,
  slots,
  className,
}: SectionV3Props) {
  return (
    <section
      className={cn(paddingMap[padding], className)}
      style={background ? { background } : undefined}
    >
      {slots?.children}
    </section>
  );
}
