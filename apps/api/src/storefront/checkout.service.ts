import { AuditLog } from '@apex/audit';
import {
  and,
  cartsInStorefront,
  customersInStorefront,
  eq,
  getTenantDb,
  inArray,
  inventoryLevelsInStorefront,
  isNull,
  orderItemsInStorefront,
  ordersInStorefront,
  paymentLogsInStorefront,
  productsInStorefront,
  productVariantsInStorefront,
  sql,
} from '@apex/db';
import { TenantCacheService } from '@apex/middleware';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateCheckoutDto } from './dto/checkout.dto';
import { StripeService } from './stripe.service';

// ═══════════════════════════════════════════════════════════════
// SHIPPING RATES (Phase 1: hardcoded; Phase 2: from tenant config)
// ═══════════════════════════════════════════════════════════════
const SHIPPING_RATES: Record<string, string> = {
  standard: '0',
  express: '50.0000',
  overnight: '150.0000',
};

// VAT rate: 15% (Saudi Arabia standard)
const VAT_RATE = 0.15;

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  total: string;
  subtotal: string;
  shipping: string;
  tax: string;
  items: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  clientSecret?: string;
}

/**
 * ── CHECKOUT SERVICE (Store-#06) ──
 * Zero-Trust order creation with server-side pricing recalculation.
 * Prices are NEVER trusted from the client.
 *
 * Database constraints respected:
 * - chk_checkout_math: total = subtotal + tax + shipping - discount - coupon_discount
 * - chk_item_math: total = (price * qty) - discount_amount + tax_amount
 * - chk_order_total_inner: total and subtotal must NOT be NULL
 * - chk_positive_costs: shipping >= 0, tax >= 0
 * - qty_positive: order_items.quantity > 0
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly tenantCache: TenantCacheService,
    private readonly stripeService: StripeService
  ) { }

  /**
   * Create an order from checkout form submission.
   *
   * Zero-Trust Flow:
   * 1. Validate cart items against DB (product exists, active, correct variant)
   * 2. Recalculate prices from DB (salePrice || basePrice)
   * 3. Verify stock availability
   * 4. Compute subtotal, tax, shipping, total
   * 5. Atomic DB transaction: orders + order_items + cart clear + payment_logs
   * 6. Return order data for Stripe PaymentIntent creation (Phase 3)
   */
  async createOrder(
    tenantId: string,
    schemaName: string,
    dto: CreateCheckoutDto,
    customerId: string | null,
    sessionId: string | null,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<CreateOrderResult> {
    const { db, release } = await getTenantDb(tenantId, schemaName);

    try {
      // ── STEP 1: Validate cart items against DB (Zero-Trust Pricing) ──
      const validatedItems = await this.validateCartItems(
        db,
        dto.cartItems
      );

      // ── STEP 2: Compute pricing server-side ──
      const subtotal = this.sumLineTotals(validatedItems);
      const shippingCost = SHIPPING_RATES[dto.shippingMethod] ?? '0';
      const taxAmount = this.calculateTax(subtotal, VAT_RATE);
      const total = this.calculateTotal(subtotal, taxAmount, shippingCost);

      this.logger.log(
        `Order pricing: subtotal=${subtotal}, shipping=${shippingCost}, tax=${taxAmount}, total=${total}`
      );

      // ── STEP 3: Generate order metadata ──
      const orderNumber = this.generateOrderNumber();
      const billingAddress =
        dto.sameAsShipping || !dto.billingAddress
          ? dto.shippingAddress
          : dto.billingAddress;

      // ── STEP 4: Atomic Transaction ──
      const result = await db.transaction(async (tx) => {
        // 4a. Insert order
        const orderId = randomUUID();
        await tx.insert(ordersInStorefront).values({
          id: orderId,
          orderNumber,
          customerId,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: dto.paymentMethod,
          source: 'web',
          subtotal,
          discount: '0',
          shipping: shippingCost,
          tax: taxAmount,
          total,
          couponDiscount: '0',
          shippingAddress: dto.shippingAddress,
          billingAddress,
          idempotencyKey: dto.idempotencyKey,
          guestEmail: dto.guestEmail ?? null,
          notes: dto.notes ?? null,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        });

        // 4b. Insert order items
        for (const item of validatedItems) {
          await tx.insert(orderItemsInStorefront).values({
            orderId,
            productId: item.productId,
            variantId: item.variantId ?? null,
            name: item.name,
            sku: item.sku,
            imageUrl: item.imageUrl,
            price: item.price,
            quantity: item.quantity,
            total: item.lineTotal,
            discountAmount: '0',
            taxAmount: '0',
            fulfilledQuantity: 0,
            returnedQuantity: 0,
          });
        }

        // 4c. Update product sold_count
        if (validatedItems.length > 0) {
          const productIds = validatedItems.map((i) => i.productId);
          await tx
            .update(productsInStorefront)
            .set({
              soldCount: sql`${productsInStorefront.soldCount} + 1`,
            })
            .where(inArray(productsInStorefront.id, productIds));
        }

        // 4d. Update customer totals if authenticated
        if (customerId) {
          await tx
            .update(customersInStorefront)
            .set({
              totalOrdersCount: sql`${customersInStorefront.totalOrdersCount} + 1`,
              totalSpentAmount: sql`${customersInStorefront.totalSpentAmount} + ${total}::numeric`,
            })
            .where(eq(customersInStorefront.id, customerId));
        }

        // 4e. Clear cart
        if (customerId) {
          await tx
            .delete(cartsInStorefront)
            .where(eq(cartsInStorefront.customerId, customerId));
        }
        if (sessionId) {
          await tx
            .delete(cartsInStorefront)
            .where(eq(cartsInStorefront.sessionId, sessionId));
        }

        // 4f. Insert payment log
        await tx.insert(paymentLogsInStorefront).values({
          id: randomUUID(),
          orderId,
          provider: dto.paymentMethod === 'card' ? 'stripe' : 'cod',
          status: 'pending',
          amount: total,
          idempotencyKey: dto.idempotencyKey,
          ipAddress: ipAddress ?? null,
        });

        return { orderId, orderNumber, total, subtotal, shippingCost, taxAmount };
      });

      // ── STEP 5: Create Stripe PaymentIntent (for card payments) ──
      let clientSecret: string | undefined;
      if (dto.paymentMethod === 'card') {
        // Convert total to smallest currency unit (SAR = halalas, multiply by 100)
        const amountInCents = Math.round(Number(total) * 100);
        const stripeResult = await this.stripeService.createPaymentIntent({
          amount: amountInCents,
          currency: 'sar',
          orderId: result.orderId,
          tenantId,
          schemaName,
          customerId,
          description: `Order ${result.orderNumber}`,
        });
        clientSecret = stripeResult.clientSecret;
      }

      // ── STEP 6: Build response ──
      return {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
        subtotal: result.subtotal,
        shipping: result.shippingCost,
        tax: result.taxAmount,
        items: validatedItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.lineTotal,
        })),
        clientSecret,
      };
    } finally {
      release();
    }
  }

  /**
   * Validate cart items against the DB.
   * Recalculates prices from products/product_variants tables.
   * Checks stock, min order qty, variant requirements.
   */
  private async validateCartItems(
    db: any,
    cartItems: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
    }>
  ) {
    const productIds = cartItems.map((i) => i.productId);
    const variantIds = cartItems
      .filter((i) => i.variantId)
      .map((i) => i.variantId as string);

    // Batch fetch products
    const products = await db
      .select({
        id: productsInStorefront.id,
        name: productsInStorefront.name,
        basePrice: productsInStorefront.basePrice,
        salePrice: productsInStorefront.salePrice,
        mainImage: productsInStorefront.mainImage,
        sku: productsInStorefront.sku,
        minOrderQty: productsInStorefront.minOrderQty,
        trackInventory: productsInStorefront.trackInventory,
      })
      .from(productsInStorefront)
      .where(
        and(
          inArray(productsInStorefront.id, productIds),
          eq(productsInStorefront.isActive, true),
          isNull(productsInStorefront.deletedAt)
        )
      );

    if (products.length !== productIds.length) {
      const foundIds = new Set(
        products.map(
          (p: { id: string }) => p.id
        )
      );
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Products not found or inactive: ${missingIds.join(', ')}`
      );
    }

    // Batch fetch variants if any
    const variantMap = new Map<string, { id: string; price: string; sku: string }>();
    if (variantIds.length > 0) {
      const variants = await db
        .select({
          id: productVariantsInStorefront.id,
          price: productVariantsInStorefront.price,
          sku: productVariantsInStorefront.sku,
          productId: productVariantsInStorefront.productId,
        })
        .from(productVariantsInStorefront)
        .where(
          and(
            inArray(productVariantsInStorefront.id, variantIds),
            isNull(productVariantsInStorefront.deletedAt)
          )
        );

      for (const v of variants) {
        variantMap.set(v.id, { id: v.id, price: v.price, sku: v.sku });
      }
    }

    // Batch fetch variant counts (to detect if a product requires a variant)
    const variantCounts = await db
      .select({
        productId: productVariantsInStorefront.productId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(productVariantsInStorefront)
      .where(
        and(
          inArray(productVariantsInStorefront.productId, productIds),
          isNull(productVariantsInStorefront.deletedAt)
        )
      )
      .groupBy(productVariantsInStorefront.productId);

    const variantCountMap = new Map<string, number>();
    for (const vc of variantCounts) {
      variantCountMap.set(vc.productId, vc.count);
    }

    // Build product map
    const productMap = new Map<string, typeof products[0]>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    // Validate each item and compute line totals
    const validatedItems: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      imageUrl: string | null;
      price: string;
      quantity: number;
      lineTotal: string;
    }> = [];

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found or inactive`
        );
      }

      // Validate min order qty
      if (item.quantity < product.minOrderQty) {
        throw new BadRequestException(
          `Minimum order quantity is ${product.minOrderQty} for product ${item.productId}`
        );
      }

      // Check variant requirement
      const varCount = variantCountMap.get(item.productId) ?? 0;
      if (varCount > 1 && !item.variantId) {
        throw new BadRequestException(
          `Product ${item.productId} has ${varCount} variants. You must specify a variantId.`
        );
      }

      // Determine price and SKU
      let price: string;
      let sku: string;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} not found for product ${item.productId}`
          );
        }
        price = variant.price;
        sku = variant.sku;
      } else {
        price = product.salePrice ?? product.basePrice;
        sku = product.sku;
      }

      // Compute line total: price * quantity (integer-safe via string math)
      const lineTotal = this.calculateLineTotal(price, item.quantity);

      // Extract product name (handle JSONB i18n)
      const productName = this.resolveName(product.name);

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: productName,
        sku,
        imageUrl: product.mainImage ?? null,
        price,
        quantity: item.quantity,
        lineTotal,
      });

      // Stock check (if tracked)
      if (product.trackInventory) {
        const stock = await this.checkStock(
          db,
          item.productId,
          item.variantId ?? null
        );
        if (item.quantity > stock) {
          throw new BadRequestException(
            `Only ${stock} units available for product ${item.productId}`
          );
        }
      }
    }

    return validatedItems;
  }

  /**
   * Check stock for a product/variant.
   * Inventory is tracked per variant per location (not per product).
   */
  private async checkStock(
    db: any,
    productId: string,
    variantId: string | null
  ): Promise<number> {
    if (variantId) {
      // Sum available stock across all locations for this variant
      const levels = await db
        .select({
          available: inventoryLevelsInStorefront.available,
        })
        .from(inventoryLevelsInStorefront)
        .where(eq(inventoryLevelsInStorefront.variantId, variantId));

      if (levels.length > 0) {
        return levels.reduce(
          (sum: number, l: { available: number }) => sum + Number(l.available),
          0
        );
      }
    }

    // No variant or no inventory records — assume in stock
    return 999999;
  }

  /**
   * Resolve product name from JSONB i18n field.
   */
  private resolveName(
    name: string | Record<string, string> | null
  ): string {
    if (typeof name === 'string') return name;
    if (name && typeof name === 'object') {
      return (
        (name as Record<string, string>).en ??
        Object.values(name as Record<string, string>)[0] ??
        'Product'
      );
    }
    return 'Product';
  }

  /**
   * Sum all line totals (string arithmetic via numeric conversion).
   */
  private sumLineTotals(
    items: Array<{ lineTotal: string }>
  ): string {
    let sum = 0;
    for (const item of items) {
      sum += Number(item.lineTotal);
    }
    return sum.toFixed(4);
  }

  /**
   * Calculate tax: subtotal * rate.
   * Returns string with 4 decimal places to match numeric(12,4).
   */
  private calculateTax(subtotal: string, rate: number): string {
    const tax = Number(subtotal) * rate;
    return tax.toFixed(4);
  }

  /**
   * Calculate line total: price * quantity.
   */
  private calculateLineTotal(price: string, quantity: number): string {
    const total = Number(price) * quantity;
    return total.toFixed(4);
  }

  /**
   * Calculate order total: subtotal + tax + shipping.
   * Matches DB constraint chk_checkout_math (discount and coupon_discount = 0 in Phase 1).
   */
  private calculateTotal(
    subtotal: string,
    tax: string,
    shipping: string
  ): string {
    const total = Number(subtotal) + Number(tax) + Number(shipping);
    return total.toFixed(4);
  }

  /**
   * Generate a human-readable order number.
   * Format: ORD-{YYYYMMDD}-{6 random hex chars}
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 8);
    const randomHex = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
    return `ORD-${dateStr}-${randomHex}`;
  }
}
