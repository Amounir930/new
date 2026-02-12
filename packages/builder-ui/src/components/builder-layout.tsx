import * as React from 'react'
import { TemplateGallery } from './template-gallery'
import { BuilderCanvas } from './builder-canvas'
import { PropertyEditor } from './property-editor'
import { useBuilderStore } from '../store/use-builder-store'
import { Button } from '@apex/ui'
import {
    Monitor,
    Tablet,
    Smartphone,
    Save,
    RotateCcw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

export const BuilderLayout: React.FC = () => {
    const {
        isSidebarOpen,
        setSidebarOpen,
        previewDevice,
        setPreviewDevice,
        resetTemplate,
        isDirty
    } = useBuilderStore()

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
            {/* Left Sidebar: Gallery */}
            <aside
                className={cn(
                    "h-full border-r bg-muted/10 transition-all duration-300 overflow-y-auto",
                    isSidebarOpen ? "w-80" : "w-0 border-none"
                )}
            >
                <TemplateGallery />
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header/Toolbar */}
                <header className="h-14 border-b bg-background flex items-center justify-between px-4 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                        </Button>
                        <div className="h-4 w-[1px] bg-border mx-2" />
                        <h1 className="font-semibold text-sm">Design Editor</h1>
                    </div>

                    {/* Viewport Toggles */}
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <Button
                            variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-10 px-0"
                            onClick={() => setPreviewDevice('desktop')}
                        >
                            <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-10 px-0"
                            onClick={() => setPreviewDevice('tablet')}
                        >
                            <Tablet className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-10 px-0"
                            onClick={() => setPreviewDevice('mobile')}
                        >
                            <Smartphone className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={resetTemplate}
                            disabled={!isDirty}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                        <Button size="sm" className="gap-2" disabled={!isDirty}>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </Button>
                    </div>
                </header>

                {/* Canvas Area */}
                <BuilderCanvas />
            </main>

            {/* Right Sidebar: Property Editor (Conditional) */}
            <aside className="w-80 h-full">
                <PropertyEditor />
            </aside>
        </div>
    )
}

import { cn } from '@apex/ui'
