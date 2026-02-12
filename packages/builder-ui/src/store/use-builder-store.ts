import {
  type PageTemplate,
  type TemplateSlot,
  findSlotById,
  updateSlotProps as updateSlotPropsInTemplate,
} from '@apex/template-engine';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface BuilderState {
  // Data State
  currentTemplate: PageTemplate | null;
  originalTemplate: PageTemplate | null; // For "Reset" functionality

  // UI State
  selectedSlotId: string | null;
  isSidebarOpen: boolean;
  previewDevice: PreviewDevice;
  locale: string;
  isDirty: boolean;

  // Actions
  setTemplate: (template: PageTemplate) => void;
  resetTemplate: () => void;
  selectSlot: (slotId: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  setLocale: (locale: string) => void;

  // Template Manipulation
  updateSlotProps: (slotId: string, props: any) => void;

  // Selectors/Helpers
  getSelectedSlot: () => TemplateSlot | null;
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
    setTemplate: (template) =>
      set({
        currentTemplate: template,
        originalTemplate: JSON.parse(JSON.stringify(template)),
        isDirty: false,
        selectedSlotId: null,
      }),

    resetTemplate: () => {
      const { originalTemplate } = get();
      if (originalTemplate) {
        set({
          currentTemplate: JSON.parse(JSON.stringify(originalTemplate)),
          isDirty: false,
        });
      }
    },

    selectSlot: (slotId) =>
      set({ selectedSlotId: slotId, isSidebarOpen: true }),

    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    setPreviewDevice: (device) => set({ previewDevice: device }),

    setLocale: (locale) => set({ locale }),

    updateSlotProps: (slotId, props) => {
      const { currentTemplate } = get();
      if (!currentTemplate) return;

      // Special case: update root brick itself
      if (currentTemplate.root.id === slotId) {
        set({
          currentTemplate: {
            ...currentTemplate,
            root: {
              ...currentTemplate.root,
              props: { ...currentTemplate.root.props, ...props },
            },
          },
          isDirty: true,
        });
        return;
      }

      const updatedSlots = updateSlotPropsInTemplate(
        currentTemplate.root.slots,
        slotId,
        props
      );

      set({
        currentTemplate: {
          ...currentTemplate,
          root: {
            ...currentTemplate.root,
            slots: updatedSlots,
          },
        },
        isDirty: true,
      });
    },

    getSelectedSlot: () => {
      const { currentTemplate, selectedSlotId } = get();
      if (!currentTemplate || !selectedSlotId) return null;

      if (currentTemplate.root.id === selectedSlotId) {
        return currentTemplate.root;
      }

      return findSlotById(currentTemplate.root.slots, selectedSlotId) || null;
    },
  }))
);
