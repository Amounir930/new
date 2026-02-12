import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerV3Props {
    slots?: {
        content?: React.ReactNode;
    };
    className?: string;
    isRTL?: boolean;
}

export default function PageContainerV3({ slots, className, isRTL }: PageContainerV3Props) {
    return (
        <main
            className={cn("min-h-screen", className)}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {slots?.content}
        </main>
    );
}
