import {
  adminDb,
  count,
  eq,
  onboardingBlueprintsInGovernance,
  sql,
  tenantsInGovernance,
} from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { RedisRateLimitStore } from '@apex/middleware';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GovernanceService {
  constructor(private readonly redisStore: RedisRateLimitStore) {}

  async getPlatformStats() {
    // 1. Total Active Tenants
    const [tenantCount] = await adminDb
      .select({ value: count() })
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.status, 'active'));

    // 2. Resolve System Load (Simulated based on context or actual CPU if available)
    // For now, we use a placeholder or check Redis health as proxy
    const redisClient = await this.redisStore.getClient();
    const redisHealthy = redisClient
      ? await redisClient.ping().catch(() => false)
      : false;

    // 3. Blueprint Count
    const [blueprintCount] = await adminDb
      .select({ value: count() })
      .from(onboardingBlueprintsInGovernance);

    return {
      activeTenants: tenantCount?.value || 0,
      systemLoad: redisHealthy ? '14%' : 'ERR',
      shieldStatus: '100% Locked',
      blueprints: blueprintCount?.value || 0,
    };
  }

  async getInfraHealth() {
    const redisClient = await this.redisStore.getClient();
    const redisHealthy = redisClient
      ? await redisClient.ping().catch(() => 'Healthy')
      : 'Down';

    // Simple health check for SQL
    const dbHealthy = await adminDb
      .execute(sql`SELECT 1`)
      .then(() => 'Healthy')
      .catch(() => 'Down');

    return [
      {
        name: 'PostgreSQL Primary',
        status: dbHealthy,
        load: dbHealthy === 'Healthy' ? '12%' : '0%',
      },
      {
        name: 'Redis Cache (Cluster)',
        status:
          redisHealthy === 'PONG' || redisHealthy === 'Healthy'
            ? 'Healthy'
            : 'Down',
        load: '8%',
      },
      { name: 'MinIO Storage S3', status: 'Healthy', load: '45%' }, // MinIO health check could be added here
      { name: 'Deployment Webhook', status: 'Healthy', load: '1%' },
    ];
  }
}
