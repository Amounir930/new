import {
  CreateCheckoutSchema,
  ShippingMethodSchema,
  CheckoutAddressSchema,
  CheckoutCartItemSchema,
  CheckoutPaymentMethodSchema,
} from '@apex/validation';
import { createZodDto } from 'nestjs-zod';

// ═══════════════════════════════════════════════════════════════
// CHECKOUT DTOs — Zero-Trust Order Creation (Store-#06)
// ═══════════════════════════════════════════════════════════════

export class CreateCheckoutDto extends createZodDto(CreateCheckoutSchema) { }

// Re-export types for downstream use
export type {
  ShippingMethodSchema,
  CheckoutAddressSchema as AddressSchema,
  CheckoutCartItemSchema,
  CheckoutPaymentMethodSchema,
};
