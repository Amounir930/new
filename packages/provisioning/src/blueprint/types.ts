import type { NodePgDatabase } from '@apex/db';

export interface BlueprintContext {
  subdomain: string;
  db: NodePgDatabase<Record<string, unknown>>; // MUST be scoped to tenant schema
  schema: string; // tenant_xyz
  plan: 'free' | 'basic' | 'pro' | 'enterprise'; // S15: Standardized Enums
  adminEmail: string; // Required for Core Module
  password?: string; // Secure initial password
  storeId?: string; // Reference to valid store ID
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
}

export interface BlueprintCategory {
  id: string;
  parentId?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  image?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BlueprintProduct {
  id: string;
  categoryId?: string | null;
  slug: string;
  sku: string;
  title: string;
  description?: string | null;
  shortDescription?: { ar: string; en: string } | null;
  price: string | number;
  basePrice: string | number;
  stock?: number;
  image?: string | null;
  images?: string[];
  mainImage?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface BlueprintBanner {
  id: string;
  location?: string;
  title?: string | null;
  imageUrl: string;
  link?: string | null;
  type?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BlueprintPage {
  id: string;
  slug: string;
  title: string;
  content?: string;
  isPublished?: boolean;
  pageType?: 'custom' | 'legal' | 'about';
  template?: string;
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
  products?: BlueprintProduct[];
  categories?: BlueprintCategory[];
  pages?: BlueprintPage[];
  banners?: BlueprintBanner[];
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
  pages?: BlueprintPage[];
  products?: BlueprintProduct[];
  categories?: BlueprintCategory[];
  banners?: BlueprintBanner[];
  nicheType?: string;
  uiConfig?: Record<string, unknown>;
  quotas?: Record<string, number>;
}

export interface BlueprintRecord {
  id: string;
  name: string;
  description: string | null;
  blueprint: BlueprintTemplate;
  isDefault: boolean;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  nicheType?: string | null;
  status: 'active' | 'paused';
  uiConfig?: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SeederModule {
  name: string;
  // returns allowed plans or true for all. If undefined, allowed for all.
  allowedPlans?: ('free' | 'basic' | 'pro' | 'enterprise')[] | '*';
  run(ctx: BlueprintContext, config: BlueprintConfig): Promise<void>;
}
