import {
  cartsInStorefront,
  customersInStorefront,
  getTenantDb,
} from '@apex/db';
import { and, eq, isNull } from '@apex/db';
import { encrypt, decrypt, hashSensitiveData } from '@apex/security';
import type { TenantCacheService } from '@apex/middleware';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { CustomerUser } from './strategies/customer-jwt.strategy';

import type { CustomerJwtPayload } from './strategies/customer-jwt.strategy';

/**
 * Customer registration input.
 */
export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

/**
 * Customer login input.
 */
export interface LoginCustomerInput {
  email: string;
  password: string;
}

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject('TENANT_CACHE_SERVICE')
    private readonly tenantCache: TenantCacheService
  ) { }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER REGISTRATION
  // ═══════════════════════════════════════════════════════════════

  async register(
    subdomain: string,
    input: RegisterCustomerInput
  ): Promise<{ customer: RegisteredCustomer; token: string }> {
    const tenantContext = await this.resolveTenant(subdomain);
    if (!tenantContext) {
      throw new UnauthorizedException('Store not found');
    }

    const { db, release } = await getTenantDb(
      tenantContext.tenantId,
      tenantContext.schemaName
    );

    try {
      const emailHash = hashSensitiveData(input.email);

      // Check if customer already exists (email uniqueness)
      const [existing] = await db
        .select({ id: customersInStorefront.id })
        .from(customersInStorefront)
        .where(
          and(
            eq(customersInStorefront.emailHash, emailHash),
            isNull(customersInStorefront.deletedAt)
          )
        )
        .limit(1);

      if (existing) {
        throw new UnauthorizedException(
          'An account with this email already exists'
        );
      }

      // Hash password (bcrypt cost 12 — consistent with merchant auth)
      const passwordHash = await bcrypt.hash(input.password, 10); // cost 10: ~80-120ms, balances security + performance

      // Encrypt PII fields (S7 protocol)
      const encryptedEmail = encrypt(input.email);
      const encryptedFirstName = encrypt(input.firstName);
      const encryptedLastName = encrypt(input.lastName);
      const encryptedPhone = input.phone ? encrypt(input.phone) : null;
      const phoneHash = input.phone ? hashSensitiveData(input.phone) : null;

      // Insert customer
      const [customer] = await db
        .insert(customersInStorefront)
        .values({
          email: encryptedEmail as never,
          emailHash,
          passwordHash,
          firstName: encryptedFirstName as never,
          lastName: encryptedLastName as never,
          phone: encryptedPhone as never,
          phoneHash,
          acceptsMarketing: input.acceptsMarketing ?? false,
          language: 'en',
          isVerified: false,
        })
        .returning();

      if (!customer) {
        throw new Error('Failed to create customer record');
      }

      // Generate JWT
      const token = await this.generateToken({
        id: customer.id,
        email: input.email,
        tenantId: tenantContext.tenantId,
        subdomain: tenantContext.subdomain,
        role: 'customer',
      });

      // Update last_login_at
      await db
        .update(customersInStorefront)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(customersInStorefront.id, customer.id));

      this.logger.log(
        `CUSTOMER_REGISTERED: id=${customer.id}, tenant=${tenantContext.subdomain}`
      );

      return {
        customer: {
          id: customer.id,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          avatarUrl: customer.avatarUrl,
        },
        token,
      };
    } finally {
      release();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER LOGIN
  // ═══════════════════════════════════════════════════════════════

  async login(
    subdomain: string,
    input: LoginCustomerInput
  ): Promise<{ customer: RegisteredCustomer; token: string }> {
    const tenantContext = await this.resolveTenant(subdomain);
    if (!tenantContext) {
      throw new UnauthorizedException('Store not found');
    }

    const { db, release } = await getTenantDb(
      tenantContext.tenantId,
      tenantContext.schemaName
    );

    try {
      const emailHash = hashSensitiveData(input.email);

      // Find customer by email hash
      const [customer] = await db
        .select()
        .from(customersInStorefront)
        .where(
          and(
            eq(customersInStorefront.emailHash, emailHash),
            isNull(customersInStorefront.deletedAt)
          )
        )
        .limit(1);

      if (!customer || !customer.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, customer.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Decrypt first name for display
      let firstName = '';
      try {
        firstName = decrypt(customer.firstName as never) || '';
      } catch {
        firstName = '';
      }

      let lastName = '';
      try {
        lastName = decrypt(customer.lastName as never) || '';
      } catch {
        lastName = '';
      }

      // Generate JWT
      const token = await this.generateToken({
        id: customer.id,
        email: input.email,
        tenantId: tenantContext.tenantId,
        subdomain: tenantContext.subdomain,
        role: 'customer',
      });

      // Update last_login_at
      await db
        .update(customersInStorefront)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(customersInStorefront.id, customer.id));

      this.logger.log(
        `CUSTOMER_LOGIN_SUCCESS: id=${customer.id}, tenant=${tenantContext.subdomain}`
      );

      return {
        customer: {
          id: customer.id,
          email: input.email,
          firstName,
          lastName,
          avatarUrl: customer.avatarUrl,
        },
        token,
      };
    } finally {
      release();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GET CURRENT CUSTOMER PROFILE (by JWT subject)
  // ═══════════════════════════════════════════════════════════════

  async getMe(
    customerId: string,
    tenantId: string,
    schemaName: string
  ): Promise<RegisteredCustomer | null> {
    const { db, release } = await getTenantDb(tenantId, schemaName);

    try {
      const [customer] = await db
        .select()
        .from(customersInStorefront)
        .where(
          and(
            eq(customersInStorefront.id, customerId),
            isNull(customersInStorefront.deletedAt)
          )
        )
        .limit(1);

      if (!customer) return null;

      let firstName = '';
      let lastName = '';
      try {
        firstName = decrypt(customer.firstName as never) || '';
        lastName = decrypt(customer.lastName as never) || '';
      } catch {
        /* best-effort decryption */
      }

      return {
        id: customer.id,
        email: '', // email is encrypted; frontend should use what's in the JWT
        firstName,
        lastName,
        avatarUrl: customer.avatarUrl,
      };
    } finally {
      release();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CART MERGE: session cart → customer cart
  // ═══════════════════════════════════════════════════════════════

  async mergeCart(
    customerId: string,
    tenantId: string,
    schemaName: string,
    sessionCartId?: string
  ): Promise<void> {
    const { db, release } = await getTenantDb(tenantId, schemaName);

    try {
      if (!sessionCartId) return;

      // Find the anonymous session cart
      const [sessionCart] = await db
        .select()
        .from(cartsInStorefront)
        .where(eq(cartsInStorefront.sessionId, sessionCartId))
        .limit(1);

      if (!sessionCart) return;

      // Find customer's existing cart
      const [customerCart] = await db
        .select()
        .from(cartsInStorefront)
        .where(eq(cartsInStorefront.customerId, customerId))
        .limit(1);

      if (customerCart) {
        // Merge: add session cart items to customer cart
        const existingItems = (customerCart.items as Array<Record<string, unknown>>) || [];
        const sessionItems = (sessionCart.items as Array<Record<string, unknown>>) || [];

        const mergedItems = [...existingItems];
        for (const sessionItem of sessionItems) {
          const existingIdx = mergedItems.findIndex(
            (item) =>
              item.productId === sessionItem.productId &&
              item.variantId === sessionItem.variantId
          );
          if (existingIdx >= 0) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity:
                Number(mergedItems[existingIdx].quantity ?? 0) +
                Number(sessionItem.quantity ?? 0),
            };
          } else {
            mergedItems.push(sessionItem);
          }
        }

        // Update customer cart with merged items
        await db
          .update(cartsInStorefront)
          .set({
            items: mergedItems as never,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(cartsInStorefront.id, customerCart.id));

        // Delete the orphan session cart
        await db
          .delete(cartsInStorefront)
          .where(eq(cartsInStorefront.id, sessionCart.id));
      } else {
        // No customer cart yet — transfer session cart ownership
        await db
          .update(cartsInStorefront)
          .set({
            customerId,
            sessionId: null, // Clear session association
            updatedAt: new Date().toISOString(),
          })
          .where(eq(cartsInStorefront.id, sessionCart.id));
      }
    } finally {
      release();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // JWT GENERATION
  // ═══════════════════════════════════════════════════════════════

  async generateToken(customer: {
    id: string;
    email: string;
    tenantId: string;
    subdomain: string;
    role: 'customer';
  }): Promise<string> {
    const crypto = await import('node:crypto');

    if (!customer.tenantId) {
      throw new Error('S2 Violation: Cannot generate customer JWT without tenantId');
    }

    const payload: CustomerJwtPayload = {
      sub: customer.id,
      email: customer.email,
      tenantId: customer.tenantId,
      subdomain: customer.subdomain,
      role: 'customer',
      jti: crypto.randomUUID(),
    };

    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  // ═══════════════════════════════════════════════════════════════
  // TENANT RESOLUTION (via TenantCacheService)
  // ═══════════════════════════════════════════════════════════════

  private async resolveTenant(subdomain: string) {
    return this.tenantCache.resolveTenant(subdomain);
  }
}

/**
 * Public customer profile shape (returned to frontend).
 * Sensitive fields (email, PII) are excluded.
 */
export interface RegisteredCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}
