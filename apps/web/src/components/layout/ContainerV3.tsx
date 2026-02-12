import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerV3Props {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  slots?: {
    children?: React.ReactNode;
  };
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'container', // Follows the project's standard container
  full: 'max-w-full',
};

export default function ContainerV3({
  maxWidth = 'xl',
  slots,
  className,
}: ContainerV3Props) {
  return (
    <div
      className={cn('mx-auto px-4 md:px-6', maxWidthMap[maxWidth], className)}
    >
      {slots?.children}
    </div>
  );
}
