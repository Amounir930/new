import * as React from 'react'
import {
    homeTemplate,
    productTemplate,
    cartTemplate,
    checkoutTemplate
} from '@apex/template-engine'
import { useBuilderStore } from '../store/use-builder-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@apex/ui'
import { Layout } from 'lucide-react'

const TEMPLATES = [
    homeTemplate,
    productTemplate,
    cartTemplate,
    checkoutTemplate
]

export const TemplateGallery: React.FC = () => {
    const { setTemplate, currentTemplate } = useBuilderStore()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Template Gallery</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map((template) => (
                    <Card
                        key={template.id}
                        className={cn(
                            "cursor-pointer hover:border-primary transition-colors",
                            currentTemplate?.id === template.id && "border-primary ring-1 ring-primary"
                        )}
                        onClick={() => setTemplate(template)}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="aspect-video bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                                Preview Placeholder
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

import { cn } from '@apex/ui'
