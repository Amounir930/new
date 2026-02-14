var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// biome-ignore lint/style/useImportType: Needed for NestJS DI
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import { customers, } from '../schema/storefront/customers.js';
/**
 * S7: Customer Service
 * Handles encryption/decryption of PII data (Email, Phone) via AES-256-GCM.
 * Uses Blind Indexing (SHA-256) for searchability.
 */
let CustomerService = class CustomerService {
    encryptionService;
    constructor(encryptionService) {
        this.encryptionService = encryptionService;
    }
    /**
     * Create a new customer with encrypted PII.
     */
    async create(data) {
        // 1. Generate Blind Indexes (hashes)
        const emailHash = this.encryptionService.hashSensitiveData(data.email);
        let phoneHash = null;
        if (data.phone) {
            phoneHash = this.encryptionService.hashSensitiveData(data.phone);
        }
        // 2. Encrypt PII (JSON: { encrypted, iv, tag, salt })
        const encryptedEmail = JSON.stringify(this.encryptionService.encrypt(data.email));
        let encryptedPhone = null;
        if (data.phone) {
            encryptedPhone = JSON.stringify(this.encryptionService.encrypt(data.phone));
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
    async findByEmail(email) {
        const emailHash = this.encryptionService.hashSensitiveData(email);
        const result = await publicDb
            .select()
            .from(customers)
            .where(eq(customers.emailHash, emailHash))
            .limit(1);
        if (result.length === 0)
            return null;
        return this.decryptCustomer(result[0]);
    }
    /**
     * Find customer by ID.
     */
    async findById(id) {
        const result = await publicDb
            .select()
            .from(customers)
            .where(eq(customers.id, id))
            .limit(1);
        if (result.length === 0)
            return null;
        return this.decryptCustomer(result[0]);
    }
    /**
     * Helper: Decrypts a customer record.
     */
    decryptCustomer(customer) {
        const decryptField = (field) => {
            if (!field)
                return null;
            try {
                const parsed = JSON.parse(field);
                return this.encryptionService.decrypt(parsed);
            }
            catch (_e) {
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
};
CustomerService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EncryptionService])
], CustomerService);
export { CustomerService };
//# sourceMappingURL=customer.service.js.map