export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended' | 'archived' | 'purging' | 'deleted';
  createdAt: string;
  ownerEmail: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface FeatureState {
  enabled: boolean;
  source: 'plan' | 'tenant';
}

export interface TenantFeatures {
  [key: string]: FeatureState;
}
