import { EncryptionService } from '@apex/security';
import { type Customer, type NewCustomer } from '../schema/storefront/customers.js';
/**
 * S7: Customer Service
 * Handles encryption/decryption of PII data (Email, Phone) via AES-256-GCM.
 * Uses Blind Indexing (SHA-256) for searchability.
 */
export declare class CustomerService {
    private readonly encryptionService;
    constructor(encryptionService: EncryptionService);
    /**
     * Create a new customer with encrypted PII.
     */
    create(data: Omit<NewCustomer, 'id' | 'emailHash' | 'phoneHash' | 'createdAt' | 'lastLoginAt' | 'isVerified' | 'loyaltyPoints' | 'walletBalance'>): Promise<Customer>;
    /**
     * Find customer by email using Blind Index.
     */
    findByEmail(email: string): Promise<Customer | null>;
    /**
     * Find customer by ID.
     */
    findById(id: string): Promise<Customer | null>;
    /**
     * Helper: Decrypts a customer record.
     */
    private decryptCustomer;
}
//# sourceMappingURL=customer.service.d.ts.map