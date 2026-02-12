import { type Blueprint, type Brick, type ResolvedBrick } from './schema/v3';

/**
 * 🏛️ Legacy Type Aliases (LEGO v3 Compatibility)
 */
export type PageTemplate = Blueprint;
export type TemplateSlot = (Brick | ResolvedBrick) & { componentName?: string };

/**
 * 🏛️ Legacy TemplateRenderer Placeholder
 */
export const TemplateRenderer = (_props: any): any => null;

/**
 * 🏛️ Legacy Metadata Bridge
 */
export const getComponentEntry = (type: string) => ({
  name: type,
  description: '',
  icon: 'Box',
  props: {},
});

/**
 * 🗺️ Legacy Blueprint Aliases (LEGO v3 Compatibility)
 */
import { v3HomeTemplate } from './templates/v3-blueprints';
export const homeTemplate = v3HomeTemplate;
export const productTemplate = v3HomeTemplate; // Placeholder for now
export const checkoutTemplate = v3HomeTemplate; // Placeholder for now
export const cartTemplate = v3HomeTemplate; // Placeholder for now

/**
 * 🔍 Find a slot (brick) by ID recursively in a hierarchy of bricks
 */
export function findSlotById(slots: Record<string, Brick[]> | undefined, id: string): Brick | null {
    if (!slots) return null;

    for (const slotBricks of Object.values(slots)) {
        for (const brick of slotBricks) {
            if (brick.id === id) return brick;
            if (brick.slots) {
                const found = findSlotById(brick.slots, id);
                if (found) return found;
            }
        }
    }
    return null;
}

/**
 * 🛠️ Update props for a specific brick recursively
 * Note: Returns a new tree to maintain immutability (important for Zustand/React)
 */
export function updateSlotProps(
    slots: Record<string, Brick[]> | undefined,
    targetId: string,
    newProps: any
): Record<string, Brick[]> | undefined {
    if (!slots) return undefined;

    const newSlots: Record<string, Brick[]> = {};

    for (const [name, bricks] of Object.entries(slots)) {
        newSlots[name] = bricks.map(brick => {
            if (brick.id === targetId) {
                return {
                    ...brick,
                    props: { ...brick.props, ...newProps }
                };
            }
            if (brick.slots) {
                return {
                    ...brick,
                    slots: updateSlotProps(brick.slots, targetId, newProps)
                };
            }
            return brick;
        });
    }

    return newSlots;
}
