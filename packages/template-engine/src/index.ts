/**
 * 🧱 LEGO-Modular Template Engine (v3)
 * Following S1 (Standard Setup) & S8 (Structural Integrity)
 */

export {
  BrickSchema,
  BlueprintSchema,
  validateBlueprint,
  validateBrick,
  type Brick,
  type Blueprint,
  type ResolvedBrick,
} from './schema/v3';
export { v3Resolver, type ResolverContext } from './resolver/v3-resolver';
export * from './bricks/definitions';
export * from './templates/v3-blueprints';
export {
  findSlotById,
  updateSlotProps,
  TemplateRenderer,
  getComponentEntry,
  homeTemplate,
  productTemplate,
  checkoutTemplate,
  cartTemplate,
  type PageTemplate,
  type TemplateSlot,
} from './legacy';
