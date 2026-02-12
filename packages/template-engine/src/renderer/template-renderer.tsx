/**
 * Template Renderer
 * Core engine that composes components into complete pages
 */

import React from 'react';
import { getComponent } from '../registry/component-registry';
import type {
  PageTemplate,
  TemplateDataContext,
  TemplateSlot,
} from '../schema/template-schema';
import { validateSlots } from '../slots/slot-system';

/**
 * Rendering error
 */
export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

/**
 * Resolve data binding from context
 */
function resolveDataBinding(
  binding: string,
  context: TemplateDataContext
): any {
  const parts = binding.split('.');
  let value: any = context;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Evaluate condition expression
 */
function evaluateCondition(
  condition: string,
  context: TemplateDataContext
): boolean {
  try {
    // Simple evaluation - in production, use a safe expression parser
    // For now, just check if the referenced data exists
    const data = resolveDataBinding(condition, context);
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Render a single slot
 */
export function renderSlot(
  slot: TemplateSlot,
  context: TemplateDataContext,
  key?: string | number
): React.ReactNode {
  // Check conditional rendering
  if (slot.condition && !evaluateCondition(slot.condition, context)) {
    return null;
  }

  // Get component from registry
  const Component = getComponent(slot.componentName);
  if (!Component) {
    throw new TemplateRenderError(
      `Component "${slot.componentName}" not found in registry`
    );
  }

  // Resolve data binding if present
  let props = { ...slot.props };
  if (slot.dataBinding) {
    const boundData = resolveDataBinding(slot.dataBinding, context);
    props = { ...props, ...boundData };
  }

  // Render children slots
  const children = slot.children?.map((child, index) =>
    renderSlot(child, context, `${slot.id}-${index}`)
  );

  // Inject data-slot-id if in builder mode
  const finalProps = {
    ...props,
    key: key || slot.id,
    ...(context.builderMode ? { 'data-slot-id': slot.id } : {}),
  };

  // Render component using JSX
  return <Component {...finalProps}>{children}</Component>;
}

/**
 * Render a complete page template
 */
export function renderTemplate(
  template: PageTemplate,
  context: TemplateDataContext = {}
): React.ReactNode {
  try {
    // Validate template slots
    validateSlots(template.slots);

    // Render all root slots
    return template.slots.map((slot, index) =>
      renderSlot(slot, context, `root-${index}`)
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new TemplateRenderError(
        `Failed to render template "${template.name}": ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Template Renderer Component
 * React component wrapper for template rendering
 */
export interface TemplateRendererProps {
  /** Template to render */
  template: PageTemplate;
  /** Data context for binding */
  data?: TemplateDataContext;
  /** Additional className */
  className?: string;
  /** Locale for RTL support */
  locale?: string;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  data = {},
  className,
  locale,
}) => {
  // Add locale and builderMode to data context
  const contextWithMetadata = {
    ...data,
    locale: locale || data.locale || 'en',
    builderMode: data.builderMode || className?.includes('builder-active'),
  };

  // Determine text direction
  const isRTL = locale === 'ar' || locale?.startsWith('ar');
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className={className} dir={dir}>
      {renderTemplate(template, contextWithMetadata)}
    </div>
  );
}
