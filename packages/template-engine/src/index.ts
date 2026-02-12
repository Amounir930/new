/**
 * 🧱 LEGO-Modular Template Engine (v3)
 * Following S1 (Standard Setup) & S8 (Structural Integrity)
 */

export * from './bricks/definitions';
export {
  cartTemplate,
  checkoutTemplate,
  findSlotById,
  getComponentEntry,
  homeTemplate,
  type PageTemplate,
  productTemplate,
  TemplateRenderer,
  type TemplateSlot,
  updateSlotProps,
} from './legacy';
export { type ResolverContext, v3Resolver } from './resolver/v3-resolver';
export {
  type Blueprint,
  BlueprintSchema,
  type Brick,
  BrickSchema,
  type ResolvedBrick,
  validateBlueprint,
  validateBrick,
} from './schema/v3';
export * from './templates/v3-blueprints';
