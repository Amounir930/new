/**
 * Template Engine
 * Public API exports
 */

// Registry
export {
  COMPONENT_REGISTRY,
  getComponent,
  getComponentEntry,
  getComponentsByCategory,
  hasComponent,
  getAllComponentNames,
  type ComponentCategory,
  type ComponentRegistryEntry,
} from './registry/component-registry';

// Schema
export {
  validateTemplate,
  isTemplateSlot,
  isPageTemplate,
  TemplateSlotSchema,
  TemplateMetadataSchema,
  PageTemplateSchema,
  type TemplateSlot,
  type PageTemplate,
  type TemplateMetadata,
  type TemplateDataContext,
} from './schema/template-schema';

// Slots
export {
  validateSlot,
  validateSlots,
  findSlotById,
  updateSlotProps,
  addChildSlot,
  removeSlot,
  getAllSlotIds,
  countSlots,
  SlotValidationError,
} from './slots/slot-system';

// Renderer
export {
  renderSlot,
  renderTemplate,
  TemplateRenderer,
  TemplateRenderError,
  type TemplateRendererProps,
} from './renderer/template-renderer';

// Pre-built Templates
export { homeTemplate } from './templates/home-template';
export { productTemplate } from './templates/product-template';
export { cartTemplate } from './templates/cart-template';
export { checkoutTemplate } from './templates/checkout-template';
