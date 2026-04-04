import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  TenantJwtMatchGuard,
} from '@apex/auth';
import {
  and,
  asc,
  customersInStorefront,
  desc,
  eq,
  isNull,
  sql,
} from '@apex/db';
import { decrypt } from '@apex/security';
import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import type { InferSelectModel } from '@apex/db';
import { requireExecutor } from '@apex/middleware';

type CustomerRow = InferSelectModel<typeof customersInStorefront>;

// ── Query validation ──────────────────────────────────────────────
const CustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'spent_desc', 'name_asc']).default('newest'),
});

// ── Safe decrypt helper ────────────────────────────────────────────
function safeDecrypt(data: unknown): string {
  try {
    return decrypt(data as never) || '';
  } catch {
    return '';
  }
}

// ── Response DTOs ──────────────────────────────────────────────────
export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  totalOrdersCount: number;
  totalSpentAmount: string;
  walletBalance: string;
  loyaltyPoints: number;
  isVerified: boolean;
  acceptsMarketing: boolean;
  avatarUrl: string | null;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerDetail extends CustomerListItem {
  gender: string | null;
  language: string;
  notes: string | null;
  tags: string | null;
  dateOfBirth: string | null;
}

@Controller('merchant/customers')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantCustomersController {
  private readonly logger = new Logger(MerchantCustomersController.name);

  // ══════════════════════════════════════════════════════════
  // GET /merchant/customers — list customers with pagination
  // ══════════════════════════════════════════════════════════
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() rawQuery: Record<string, string>
  ): Promise<CustomerListResponse> {
    const query = CustomersQuerySchema.safeParse(rawQuery);
    if (!query.success) {
      throw new BadRequestException('Invalid query parameters');
    }

    const { page, limit, search, sort } = query.data;
    const db = requireExecutor();

    // Build WHERE clause
    const conditions = [isNull(customersInStorefront.deletedAt)];

    if (search) {
      // Search by decrypted first name or last name
      // Since we can't search encrypted fields efficiently, we filter post-query
      // For large datasets, consider a searchable plaintext shadow column
      void search; // handled in post-filter
    }

    // Build ORDER BY
    const orderByMap = {
      newest: desc(customersInStorefront.createdAt),
      oldest: asc(customersInStorefront.createdAt),
      spent_desc: desc(customersInStorefront.totalSpentAmount),
      name_asc: asc(customersInStorefront.firstName),
    };
    const orderBy = orderByMap[sort];

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(customersInStorefront)
      .where(and(...conditions));

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch page
    const rows = await db
      .select()
      .from(customersInStorefront)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    // Decrypt PII and build response
    let customers: CustomerListItem[] = rows.map((row: CustomerRow) => ({
      id: row.id,
      email: '', // email stays encrypted; use emailHash for identification only
      firstName: safeDecrypt(row.firstName),
      lastName: safeDecrypt(row.lastName),
      phone: row.phone ? safeDecrypt(row.phone) : null,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      totalOrdersCount: row.totalOrdersCount,
      totalSpentAmount: row.totalSpentAmount,
      walletBalance: row.walletBalance,
      loyaltyPoints: row.loyaltyPoints,
      isVerified: row.isVerified,
      acceptsMarketing: row.acceptsMarketing,
      avatarUrl: row.avatarUrl,
    }));

    // Post-query search on decrypted names
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower)
      );
    }

    return {
      customers,
      pagination: {
        page,
        limit,
        total: search ? customers.length : totalCount,
        totalPages: search ? Math.ceil(customers.length / limit) : totalPages,
      },
    };
  }

  // ══════════════════════════════════════════════════════════
  // GET /merchant/customers/:id — fetch single customer detail
  // ══════════════════════════════════════════════════════════
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<CustomerDetail> {
    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) {
      throw new BadRequestException('Invalid customer ID format');
    }

    const db = requireExecutor();

    const [row] = await db
      .select()
      .from(customersInStorefront)
      .where(
        and(
          eq(customersInStorefront.id, id),
          isNull(customersInStorefront.deletedAt)
        )
      )
      .limit(1);

    if (!row) {
      this.logger.warn(`CUSTOMER_NOT_FOUND: id=${id}`);
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return {
      id: row.id,
      email: '',
      firstName: safeDecrypt(row.firstName),
      lastName: safeDecrypt(row.lastName),
      phone: row.phone ? safeDecrypt(row.phone) : null,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      totalOrdersCount: row.totalOrdersCount,
      totalSpentAmount: row.totalSpentAmount,
      walletBalance: row.walletBalance,
      loyaltyPoints: row.loyaltyPoints,
      isVerified: row.isVerified,
      acceptsMarketing: row.acceptsMarketing,
      avatarUrl: row.avatarUrl,
      gender: row.gender,
      language: row.language,
      notes: row.notes,
      tags: row.tags,
      dateOfBirth: row.dateOfBirth,
    };
  }
}
