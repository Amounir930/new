'use client';

import React from 'react';
import { type ResolvedBrick } from '@apex/template-engine';
import { brickRegistry } from '@/lib/brick-registry';

interface BrickRendererProps {
  brick: ResolvedBrick;
}

/**
 * 🧱 BrickRenderer (LEGO v3)
 * Recursively renders a resolved brick tree into React components.
 */
export function BrickRenderer({ brick }: BrickRendererProps) {
  if (!brick) return null;
  const Component = brickRegistry[brick.type];

  if (!Component) {
    console.warn(`[BrickRenderer] Component not found for type: ${brick.type}`);
    return null;
  }

  // Handle nested slots
  const renderedSlots: Record<string, React.ReactNode> = {};
  if (brick.slots) {
    for (const [name, bricks] of Object.entries(brick.slots)) {
      renderedSlots[name] = bricks.map((childBrick) => (
        <BrickRenderer key={childBrick.id} brick={childBrick} />
      ));
    }
  }

  return (
    <Component {...brick.props} slots={renderedSlots}>
      {/* Default slot if no children/slots specified */}
      {renderedSlots.children}
    </Component>
  );
}
