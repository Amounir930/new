import type { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import {
  type Customer,
  customers,
  type NewCustomer,
} from '../schema/storefront/customers.js';

/**
 * S7: Customer Service
 * Handles encryption/decryption of PII data (Email, Phone) via AES-256-GCM.
 * Uses Blind Indexing (SHA-256) for searchability.
 */
@Injectable()
export class CustomerService {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Create a new customer with encrypted PII.
   */
  async create(
    data: Omit<
      NewCustomer,
      | 'id'
      | 'emailHash'
      | 'phoneHash'
      | 'createdAt'
      | 'lastLoginAt'
      | 'isVerified'
      | 'loyaltyPoints'
      | 'walletBalance'
    >
  ): Promise<Customer> {
    // 1. Generate Blind Indexes (hashes)
    const emailHash = this.encryptionService.hashSensitiveData(data.email);
    let phoneHash: string | null = null;
    if (data.phone) {
      phoneHash = this.encryptionService.hashSensitiveData(data.phone);
    }

    // 2. Encrypt PII (JSON: { encrypted, iv, tag, salt })
    const encryptedEmail = JSON.stringify(
      this.encryptionService.encrypt(data.email)
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

    // 3. Insert into DB
    const [newCustomer] = await publicDb
      .insert(customers)
      .values({
        ...data,
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
  }

  /**
   * Find customer by email using Blind Index.
   */
  async findByEmail(email: string): Promise<Customer | null> {
    const emailHash = this.encryptionService.hashSensitiveData(email);

    const result = await publicDb
      .select()
      .from(customers)
      .where(eq(customers.emailHash, emailHash))
      .limit(1);

    if (result.length === 0) return null;

    return this.decryptCustomer(result[0]);
  }

  /**
   * Find customer by ID.
   */
  async findById(id: string): Promise<Customer | null> {
    const result = await publicDb
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.decryptCustomer(result[0]);
  }

  /**
   * Helper: Decrypts a customer record.
   */
  private decryptCustomer(customer: Customer): Customer {
    const decryptField = (field: string | null): string | null => {
      if (!field) return null;
      try {
        const parsed = JSON.parse(field);
        return this.encryptionService.decrypt(parsed);
      } catch (_e) {
        // Fallback for legacy plain text or malformed data
        return field;
      }
    };

    return {
      ...customer,
      email: decryptField(customer.email) || customer.email, // Should never be null if valid
      phone: decryptField(customer.phone),
      firstName: decryptField(customer.firstName),
      lastName: decryptField(customer.lastName),
    };
  }
}
