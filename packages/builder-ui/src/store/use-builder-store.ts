import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
    type PageTemplate,
    type TemplateSlot,
    updateSlotProps as updateSlotPropsInTemplate,
    findSlotById
} from '@apex/template-engine'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface BuilderState {
    // Data State
    currentTemplate: PageTemplate | null
    originalTemplate: PageTemplate | null // For "Reset" functionality

    // UI State
    selectedSlotId: string | null
    isSidebarOpen: boolean
    previewDevice: PreviewDevice
    locale: string
    isDirty: boolean

    // Actions
    setTemplate: (template: PageTemplate) => void
    resetTemplate: () => void
    selectSlot: (slotId: string | null) => void
    setSidebarOpen: (isOpen: boolean) => void
    setPreviewDevice: (device: PreviewDevice) => void
    setLocale: (locale: string) => void

    // Template Manipulation
    updateSlotProps: (slotId: string, props: any) => void

    // Selectors/Helpers
    getSelectedSlot: () => TemplateSlot | null
}

export const useBuilderStore = create<BuilderState>()(
    subscribeWithSelector((set, get) => ({
        // Initial State
        currentTemplate: null,
        originalTemplate: null,
        selectedSlotId: null,
        isSidebarOpen: true,
        previewDevice: 'desktop',
        locale: 'en',
        isDirty: false,

        // Actions
        setTemplate: (template) => set({
            currentTemplate: template,
            originalTemplate: JSON.parse(JSON.stringify(template)),
            isDirty: false,
            selectedSlotId: null
        }),

        resetTemplate: () => {
            const { originalTemplate } = get()
            if (originalTemplate) {
                set({
                    currentTemplate: JSON.parse(JSON.stringify(originalTemplate)),
                    isDirty: false
                })
            }
        },

        selectSlot: (slotId) => set({ selectedSlotId: slotId, isSidebarOpen: true }),

        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

        setPreviewDevice: (device) => set({ previewDevice: device }),

        setLocale: (locale) => set({ locale }),

        updateSlotProps: (slotId, props) => {
            const { currentTemplate } = get()
            if (!currentTemplate) return

            const updatedSlots = updateSlotPropsInTemplate(currentTemplate.slots, slotId, props)

            set({
                currentTemplate: {
                    ...currentTemplate,
                    slots: updatedSlots
                },
                isDirty: true
            })
        },

        getSelectedSlot: () => {
            const { currentTemplate, selectedSlotId } = get()
            if (!currentTemplate || !selectedSlotId) return null
            return findSlotById(currentTemplate.slots, selectedSlotId) || null
        }
    }))
)
