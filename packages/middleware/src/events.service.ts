/**
 * S48-S49: Tenant-Aware Event Service
 * Purpose: Ensure events are correctly scoped to tenants
 */

import { Injectable, Logger } from '@nestjs/common';
import { getCurrentTenantId } from './connection-context.js';

export interface TenantEvent {
  name: string;
  payload: unknown;
  tenantId: string;
  timestamp: Date;
}

@Injectable()
export class TenantEventService {
  private readonly logger = new Logger(TenantEventService.name);

  /**
   * Emit a tenant-scoped event
   */
  async emit(name: string, payload: unknown): Promise<void> {
    const tenantId = getCurrentTenantId();

    if (!tenantId) {
      this.logger.warn(`S48: Event '${name}' emitted without tenant context`);
      // For system events, we allow 'system'
    }

    const event: TenantEvent = {
      name,
      payload,
      tenantId: tenantId || 'system',
      timestamp: new Date(),
    };

    // 🛡️ S49: Immutable Event Binding
    // In a real system, this would push to BullMQ or Kafka with tenant headers
    this.logger.log(`[EVENT][${event.tenantId}] ${event.name}`);

    // Simulate async processing
    // Example: this.bullQueue.add(event.name, event);
  }
}
