/**
 * Slot System
 * Manages template slots and component placement
 */

import { hasComponent } from '../registry/component-registry';
import type { TemplateSlot } from '../schema/template-schema';

/**
 * Slot validation error
 */
export class SlotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlotValidationError';
  }
}

/**
 * Validate a single slot
 */
export function validateSlot(slot: TemplateSlot): void {
  // Check component exists in registry
  if (!hasComponent(slot.componentName)) {
    throw new SlotValidationError(
      `Component "${slot.componentName}" not found in registry`
    );
  }

  // Validate slot ID
  if (!slot.id || typeof slot.id !== 'string') {
    throw new SlotValidationError('Slot must have a valid string ID');
  }

  // Recursively validate children
  if (slot.children) {
    for (const child of slot.children) {
      validateSlot(child);
    }
  }
}

/**
 * Validate all slots in a template
 */
export function validateSlots(slots: TemplateSlot[]): void {
  const slotIds = new Set<string>();

  function validateRecursive(slot: TemplateSlot) {
    // Check for duplicate IDs
    if (slotIds.has(slot.id)) {
      throw new SlotValidationError(`Duplicate slot ID: ${slot.id}`);
    }
    slotIds.add(slot.id);

    // Validate this slot
    validateSlot(slot);

    // Validate children
    if (slot.children) {
      for (const child of slot.children) {
        validateRecursive(child);
      }
    }
  }

  for (const slot of slots) {
    validateRecursive(slot);
  }
}

/**
 * Find a slot by ID in a template
 */
export function findSlotById(
  slots: TemplateSlot[],
  id: string
): TemplateSlot | undefined {
  for (const slot of slots) {
    if (slot.id === id) {
      return slot;
    }

    if (slot.children) {
      const found = findSlotById(slot.children, id);
      if (found) return found;
    }
  }

  return undefined;
}

/**
 * Update a slot's props
 */
export function updateSlotProps(
  slots: TemplateSlot[],
  slotId: string,
  newProps: Record<string, any>
): TemplateSlot[] {
  return slots.map((slot) => {
    if (slot.id === slotId) {
      return {
        ...slot,
        props: { ...slot.props, ...newProps },
      };
    }

    if (slot.children) {
      return {
        ...slot,
        children: updateSlotProps(slot.children, slotId, newProps),
      };
    }

    return slot;
  });
}

/**
 * Add a child slot to a parent slot
 */
export function addChildSlot(
  slots: TemplateSlot[],
  parentId: string,
  childSlot: TemplateSlot
): TemplateSlot[] {
  return slots.map((slot) => {
    if (slot.id === parentId) {
      return {
        ...slot,
        children: [...(slot.children || []), childSlot],
      };
    }

    if (slot.children) {
      return {
        ...slot,
        children: addChildSlot(slot.children, parentId, childSlot),
      };
    }

    return slot;
  });
}

/**
 * Remove a slot by ID
 */
export function removeSlot(
  slots: TemplateSlot[],
  slotId: string
): TemplateSlot[] {
  return slots
    .filter((slot) => slot.id !== slotId)
    .map((slot) => {
      if (slot.children) {
        return {
          ...slot,
          children: removeSlot(slot.children, slotId),
        };
      }
      return slot;
    });
}

/**
 * Get all slot IDs from a template
 */
export function getAllSlotIds(slots: TemplateSlot[]): string[] {
  const ids: string[] = [];

  function collectIds(slot: TemplateSlot) {
    ids.push(slot.id);
    if (slot.children) {
      for (const child of slot.children) {
        collectIds(child);
      }
    }
  }

  for (const slot of slots) {
    collectIds(slot);
  }

  return ids;
}

/**
 * Count total slots in a template
 */
export function countSlots(slots: TemplateSlot[]): number {
  let count = 0;

  function countRecursive(slot: TemplateSlot) {
    count++;
    if (slot.children) {
      for (const child of slot.children) {
        countRecursive(child);
      }
    }
  }

  for (const slot of slots) {
    countRecursive(slot);
  }

  return count;
}
