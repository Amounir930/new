/**
 * Feature Master List (S21 Strictness)
 * Authoritative list of 41+ features that MUST be present in every Blueprint.
 */
export const MASTER_FEATURE_LIST = [
  'home',
  'search',
  'pdp',
  'quickView',
  'cart',
  'checkout',
  'orderSuccess',
  'paymentFailed',
  'category',
  'flashDeals',
  'compare',
  'locations',
  'login',
  'register',
  'accountDashboard',
  'myOrders',
  'orderDetails',
  'trackOrder',
  'addresses',
  'paymentMethods',
  'wishlist',
  'wallet',
  'loyalty',
  'referral',
  'productReviews',
  'returns',
  'notifications',
  'privacyPolicy',
  'termsConditions',
  'refundPolicy',
  'aboutUs',
  'contactUs',
  'faq',
  'blog',
  'notFound',
  'maintenanceMode',
  'ajaxSearch',
  'megaMenu',
  'smartFilters',
  'toast',
  'newsletter',
] as const;

export type MasterFeature = (typeof MASTER_FEATURE_LIST)[number];

/**
 * Quota Master List
 */
export const MASTER_QUOTA_LIST = [
  'max_products',
  'max_orders',
  'max_pages',
  'storage_limit_gb',
] as const;
