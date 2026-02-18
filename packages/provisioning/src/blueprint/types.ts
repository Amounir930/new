import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface BlueprintContext {
  subdomain: string;
  db: NodePgDatabase<Record<string, unknown>>; // MUST be scoped to tenant schema
  schema: string; // tenant_xyz
  plan: string; // 'free', 'pro', etc.
  adminEmail: string; // Required for Core Module
  storeId?: string; // Reference to valid store ID
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
}

export interface BlueprintConfig {
  modules: {
    core: boolean | Record<string, unknown>; // Allow object config
    catalog?: boolean;
    blog?: boolean;
    inventory?: boolean; // Requires 'pro' plan
    [key: string]: boolean | Record<string, unknown> | undefined;
  };
  settings?: Record<string, unknown>;
  products?: unknown[]; // Legacy support for direct product injection
  categories?: unknown[]; // Legacy support for direct category injection
  pages?: unknown[]; // Legacy support for direct page injection
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
}

export interface BlueprintTemplate {
  name: string;
  version: string;
  description?: string;
  modules: {
    core: Record<string, unknown> | boolean;
    [key: string]: Record<string, unknown> | boolean | undefined;
  };
  settings?: Record<string, unknown>;
  pages?: unknown[];
  products?: unknown[];
  categories?: unknown[];
  nicheType?: string;
  uiConfig?: Record<string, unknown>;
}

export interface BlueprintRecord {
  id: string;
  name: string;
  description: string | null;
  blueprint: BlueprintTemplate;
  isDefault: boolean;
  plan: string;
  nicheType?: string | null;
  uiConfig?: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SeederModule {
  name: string;
  // returns allowed plans or true for all. If undefined, allowed for all.
  allowedPlans?: string[] | '*';
  run(ctx: BlueprintContext, config: BlueprintConfig): Promise<void>;
}
