import * as React from 'react'
import { useBuilderStore } from '../store/use-builder-store'
import { TemplateRenderer } from '@apex/template-engine'
import { cn } from '@apex/ui'

interface BuilderCanvasProps {
    className?: string
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ className }) => {
    const { currentTemplate, previewDevice, locale, selectSlot, selectedSlotId } = useBuilderStore()

    if (!currentTemplate) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
                Select a template to start building
            </div>
        )
    }

    const deviceWidths: Record<string, string> = {
        desktop: 'w-full',
        tablet: 'w-[768px]',
        mobile: 'w-[375px]'
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        // Find the closest element with a data-slot-id attribute
        const target = e.target as HTMLElement
        const slotElement = target.closest('[data-slot-id]')

        if (slotElement) {
            const slotId = slotElement.getAttribute('data-slot-id')
            if (slotId) {
                selectSlot(slotId)
            }
        } else {
            selectSlot(null)
        }
    }

    return (
        <div className={cn("flex-1 bg-muted/30 overflow-auto p-8 flex justify-center", className)}>
            <div
                className={cn(
                    "bg-background shadow-2xl transition-all duration-300 min-h-full h-fit relative",
                    deviceWidths[previewDevice]
                )}
                onClick={handleCanvasClick}
            >
                <TemplateRenderer
                    template={currentTemplate}
                    locale={locale}
                    className="builder-active"
                />

                {/* Highlight Overlay for Selected Slot (Simple implementation) */}
                {selectedSlotId && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 mix-blend-overlay" />
                )}
            </div>
        </div>
    )
}
