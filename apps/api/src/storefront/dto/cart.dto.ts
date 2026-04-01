import {
  AddToCartSchema,
  CartSyncSchema,
  RemoveCartItemSchema,
  StockCheckSchema,
  StockCheckItemSchema,
  UpdateCartItemSchema,
} from '@apex/validation';
import { createZodDto } from 'nestjs-zod';

// ═══════════════════════════════════════════════════════════════
// CART DTOs — Zero-Trust Cart Operations
// ═══════════════════════════════════════════════════════════════

export class AddToCartDto extends createZodDto(AddToCartSchema) {}

export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}

export class RemoveCartItemDto extends createZodDto(RemoveCartItemSchema) {}

export class CartSyncDto extends createZodDto(CartSyncSchema) {}

export class StockCheckDto extends createZodDto(StockCheckSchema) {}
export class StockCheckItemDto extends createZodDto(StockCheckItemSchema) {}
