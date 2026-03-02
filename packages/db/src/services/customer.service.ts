import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { withTenantConnection } from '../core.js';
import {
  type Customer,
  customers,
  type NewCustomer,
} from '../schema/storefront/customers.js';
import { TenantRegistryService } from '../tenant-registry.service.js';

/**
 * Extended tenant type for salt-rotation window.
 * oldSecretSalt is populated only during the rotation period defined by Mandate #11 / Vector 1.
 */
type TenantWithRotatedSalt = { secretSalt: string; oldSecretSalt?: string };

/**
 * S7: Customer Service — V5 Standard
 * Handles encryption/decryption of PII data (Email, Phone) via AES-256-GCM.
 * Uses Blind Indexing (SHA-256) for searchability.
 * Compliance: S2 (Isolation), S12 (GDPR Soft Delete).
 */
@Injectable()
export class CustomerService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly tenantRegistry: TenantRegistryService
  ) { }

  /**
   * Create a new customer with encrypted PII.
   */
  async create(
    tenantId: string,
    data: Omit<
      NewCustomer,
      | 'createdAt'
      | 'updatedAt'
      | 'lastLoginAt'
      | 'deletedAt'
      | 'walletBalance'
      | 'emailHash'
      | 'phoneHash'
      | 'tenantId'
    >
  ): Promise<Customer> {
    // 0. Fetch Tenant Secret Salt (Mandate #11)
    const tenant = await this.tenantRegistry.getByIdentifier(tenantId);
    if (!tenant) throw new Error('TENANT_NOT_FOUND');
    const salt = tenant.secretSalt;

    // 1. Generate Blind Indexes (hashes) with tenant-specific salt
    const emailHash = this.encryptionService.hashSensitiveData(
      data.email!,
      salt
    );
    let phoneHash: string | null = null;
    if (data.phone) {
      phoneHash = this.encryptionService.hashSensitiveData(data.phone, salt);
    }

    // 2. Encrypt PII (JSON: { encrypted, iv, tag, salt })
    const encryptedEmail = JSON.stringify(
      this.encryptionService.encrypt(data.email!)
    );

    let encryptedPhone: string | null = null;
    if (data.phone) {
      encryptedPhone = JSON.stringify(
        this.encryptionService.encrypt(data.phone)
      );
    }

    const encryptedFirstName = data.firstName
      ? JSON.stringify(this.encryptionService.encrypt(data.firstName))
      : null;

    const encryptedLastName = data.lastName
      ? JSON.stringify(this.encryptionService.encrypt(data.lastName))
      : null;

    // 3. Insert into DB using isolated context
    return await withTenantConnection(tenantId, async (db) => {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          ...data,
          tenantId,
          email: encryptedEmail,
          emailHash: emailHash,
          phone: encryptedPhone,
          phoneHash: phoneHash,
          firstName: encryptedFirstName,
          lastName: encryptedLastName,
        })
        .returning();

      // 4. Decrypt for return
      return this.decryptCustomer(newCustomer);
    });
  }

  /**
   * Find customer by email using Blind Index (Excluding Soft Deleted).
   */
  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    const tenant = await this.tenantRegistry.getByIdentifier(tenantId);
    if (!tenant) throw new Error('TENANT_NOT_FOUND');

    // Mandate #11: Consistent use of tenant-specific salt
    // Vector 1: Dual-salt verification during rotation window
    const currentSalt = tenant.secretSalt;
    // Mandate #11 / Vector 1: During the rotation window, oldSecretSalt may be set.
    const oldSalt = (tenant as unknown as TenantWithRotatedSalt).oldSecretSalt;

    const currentEmailHash = this.encryptionService.hashSensitiveData(
      email,
      currentSalt
    );
    const oldEmailHash = oldSalt
      ? this.encryptionService.hashSensitiveData(email, oldSalt)
      : null;

    return await withTenantConnection(tenantId, async (db) => {
      const result = await db
        .select()
        .from(customers)
        .where(
          and(
            oldEmailHash
              ? sql`${customers.emailHash} IN (${currentEmailHash}, ${oldEmailHash})`
              : eq(customers.emailHash, currentEmailHash),
            isNull(customers.deletedAt)
          )
        )
        .limit(1);

      if (result.length === 0) return null;

      return this.decryptCustomer(result[0]);
    });
  }

  /**
   * Find customer by ID (Excluding Soft Deleted).
   */
  async findById(tenantId: string, id: string): Promise<Customer | null> {
    return await withTenantConnection(tenantId, async (db) => {
      const result = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
        .limit(1);

      if (result.length === 0) return null;

      return this.decryptCustomer(result[0]);
    });
  }

  /**
   * Update a customer.
   * Mandate #9: Optimistic Concurrency Control (OCC).
   * Gap #3: Automated Retry with Exponential Backoff.
   */
  async update(
    tenantId: string,
    id: string,
    expectedVersion: number,
    data: Partial<NewCustomer>
  ): Promise<Customer> {
    const maxRetries = 3;
    let attempt = 0;

    let currentVersion = expectedVersion;

    while (attempt < maxRetries) {
      try {
        return await withTenantConnection(tenantId, async (db) => {
          const [updatedCustomer] = await db
            .update(customers)
            .set(data)
            .where(
              and(
                eq(customers.id, id),
                eq(customers.version, currentVersion),
                isNull(customers.deletedAt)
              )
            )
            .returning();

          if (!updatedCustomer) {
            throw new Error('STALE_DATA_OR_NOT_FOUND');
          }

          return this.decryptCustomer(updatedCustomer);
        });
      } catch (error: unknown) {
        attempt++;
        // Check for OCC Violation (P0001) or standard Stale Data
        const err = error as { code?: string; message?: string };
        const isOccError =
          err.code === 'P0001' || err.message === 'STALE_DATA_OR_NOT_FOUND';

        if (isOccError && attempt < maxRetries) {
          const delay = 2 ** attempt * 100; // Exponential backoff: 200ms, 400ms, 800ms
          console.warn(
            `[OCC] Collision detected for customer ${id}. Retrying in ${delay}ms... (Attempt ${attempt})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Re-fetch latest version for retry
          const latest = await this.findById(tenantId, id);
          if (latest) {
            currentVersion = latest.version;
          }
          continue;
        }
        throw error;
      }
    }
    throw new Error('OCC_RETRY_EXHAUSTED');
  }

  /**
   * Fatal Mandate #26: Async Generator Streaming
   * Decrypts customers in a memory-safe stream to prevent low-RAM DoS.
   */
  async *streamDecryptCustomers(
    customers: Customer[]
  ): AsyncGenerator<Customer> {
    const chunkSize = 20;
    for (let i = 0; i < customers.length; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      for (const customer of chunk) {
        yield this.decryptCustomer(customer);
      }
      // Yield to event loop
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  /**
   * Fatal Mandate #24: Chunked/Shifted Decryption
   * Prevents event-loop blocking when processing thousands of PII records.
   */
  /**
   * Risk #21: Memory-Safe Decryption Stream
   * Converting batch decryption to an async generator to prevent low-RAM DoS.
   */
  async *decryptCustomerStream(
    customers: Customer[]
  ): AsyncGenerator<Customer> {
    const chunkSize = 20;
    for (let i = 0; i < customers.length; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      for (const customer of chunk) {
        yield this.decryptCustomer(customer);
      }
      // Yield to event loop to allow other tasks to process
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  /**
   * Legacy wrapper for batch decryption (internally uses stream for safety)
   * Note: For 10K+ records, use decryptCustomerStream directly.
   */
  async decryptCustomerBatch(customers: Customer[]): Promise<Customer[]> {
    const results: Customer[] = [];
    for await (const customer of this.decryptCustomerStream(customers)) {
      results.push(customer);
    }
    return results;
  }

  /**
   * Helper: Decrypts a customer record.
   * Fatal Mandate #27: Throw hard S7_INTEGRITY_COMPROMISED on failure.
   */
  private decryptCustomer(customer: Customer): Customer {
    const decryptField = (field: string | null): string | null => {
      if (!field) return null;
      try {
        const parsed = JSON.parse(field);
        return this.encryptionService.decrypt(parsed);
      } catch (_e) {
        // Fatal Violation: Masking failures allows PII-harvesting attacks to go silent.
        throw new Error(
          'S7_INTEGRITY_COMPROMISED: PII Decryption/HMAC Mismatch'
        );
      }
    };

    return {
      ...customer,
      email: decryptField(customer.email) || '', // Mandatory field
      phone: decryptField(customer.phone),
      firstName: decryptField(customer.firstName),
      lastName: decryptField(customer.lastName),
    };
  }
}
