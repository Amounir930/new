import { z } from 'zod';

/**
 * Supplier Schema
 */
export const SupplierSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    contactName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    leadTimeDays: z.number().int().min(0).default(7),
    currency: z.string().length(3).default('SAR'),
    notes: z.string().optional(),
});

/**
 * Purchase Order Schema
 */
export const PurchaseOrderSchema = z.object({
    id: z.string().uuid().optional(),
    orderNumber: z.string().min(1),
    supplierId: z.string().uuid(),
    destinationLocationId: z.string().uuid(),
    status: z.enum(['draft', 'ordered', 'received', 'cancelled']).default('draft'),
    subtotal: z.object({ amount: z.number(), currency: z.string() }),
    taxAmount: z.object({ amount: z.number(), currency: z.string() }),
    shippingAmount: z.object({ amount: z.number(), currency: z.string() }),
    totalAmount: z.object({ amount: z.number(), currency: z.string() }),
    expectedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
});
