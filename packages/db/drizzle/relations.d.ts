export declare const abandonedCheckoutsInStorefrontRelations: import('drizzle-orm').Relations<
  'abandoned_checkouts',
  {
    customersInStorefront: import('drizzle-orm').One<'customers', false>;
  }
>;
export declare const customersInStorefrontRelations: import('drizzle-orm').Relations<
  'customers',
  {
    abandonedCheckoutsInStorefronts: import('drizzle-orm').Many<'abandoned_checkouts'>;
    cartsInStorefronts: import('drizzle-orm').Many<'carts'>;
    customerAddressesInStorefronts: import('drizzle-orm').Many<'customer_addresses'>;
    customerConsentsInStorefronts: import('drizzle-orm').Many<'customer_consents'>;
    ordersInStorefronts: import('drizzle-orm').Many<'orders'>;
  }
>;
export declare const affiliateTransactionsInStorefrontRelations: import('drizzle-orm').Relations<
  'affiliate_transactions',
  {
    affiliatePartnersInStorefront: import('drizzle-orm').One<
      'affiliate_partners',
      true
    >;
  }
>;
export declare const affiliatePartnersInStorefrontRelations: import('drizzle-orm').Relations<
  'affiliate_partners',
  {
    affiliateTransactionsInStorefronts: import('drizzle-orm').Many<'affiliate_transactions'>;
  }
>;
export declare const categoriesInStorefrontRelations: import('drizzle-orm').Relations<
  'categories',
  {
    categoriesInStorefront: import('drizzle-orm').One<'categories', false>;
    categoriesInStorefronts: import('drizzle-orm').Many<'categories'>;
    productsInStorefronts: import('drizzle-orm').Many<'products'>;
  }
>;
export declare const productsInStorefrontRelations: import('drizzle-orm').Relations<
  'products',
  {
    brandsInStorefront: import('drizzle-orm').One<'brands', false>;
    categoriesInStorefront: import('drizzle-orm').One<'categories', false>;
    b2BPricingTiersInStorefronts: import('drizzle-orm').Many<'b2b_pricing_tiers'>;
    productVariantsInStorefronts: import('drizzle-orm').Many<'product_variants'>;
    productAttributesInStorefronts: import('drizzle-orm').Many<'product_attributes'>;
    productImagesInStorefronts: import('drizzle-orm').Many<'product_images'>;
  }
>;
export declare const brandsInStorefrontRelations: import('drizzle-orm').Relations<
  'brands',
  {
    productsInStorefronts: import('drizzle-orm').Many<'products'>;
  }
>;
export declare const b2BPricingTiersInStorefrontRelations: import('drizzle-orm').Relations<
  'b2b_pricing_tiers',
  {
    b2BCompaniesInStorefront: import('drizzle-orm').One<'b2b_companies', true>;
    productsInStorefront: import('drizzle-orm').One<'products', true>;
  }
>;
export declare const b2BCompaniesInStorefrontRelations: import('drizzle-orm').Relations<
  'b2b_companies',
  {
    b2BPricingTiersInStorefronts: import('drizzle-orm').Many<'b2b_pricing_tiers'>;
    b2BUsersInStorefronts: import('drizzle-orm').Many<'b2b_users'>;
  }
>;
export declare const b2BUsersInStorefrontRelations: import('drizzle-orm').Relations<
  'b2b_users',
  {
    b2BCompaniesInStorefront: import('drizzle-orm').One<'b2b_companies', true>;
  }
>;
export declare const blogPostsInStorefrontRelations: import('drizzle-orm').Relations<
  'blog_posts',
  {
    blogCategoriesInStorefront: import('drizzle-orm').One<
      'blog_categories',
      false
    >;
  }
>;
export declare const blogCategoriesInStorefrontRelations: import('drizzle-orm').Relations<
  'blog_categories',
  {
    blogPostsInStorefronts: import('drizzle-orm').Many<'blog_posts'>;
  }
>;
export declare const cartsInStorefrontRelations: import('drizzle-orm').Relations<
  'carts',
  {
    customersInStorefront: import('drizzle-orm').One<'customers', false>;
    cartItemsInStorefronts: import('drizzle-orm').Many<'cart_items'>;
  }
>;
export declare const cartItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'cart_items',
  {
    cartsInStorefront: import('drizzle-orm').One<'carts', true>;
  }
>;
export declare const couponUsagesInStorefrontRelations: import('drizzle-orm').Relations<
  'coupon_usages',
  {
    couponsInStorefront: import('drizzle-orm').One<'coupons', true>;
  }
>;
export declare const couponsInStorefrontRelations: import('drizzle-orm').Relations<
  'coupons',
  {
    couponUsagesInStorefronts: import('drizzle-orm').Many<'coupon_usages'>;
  }
>;
export declare const customerAddressesInStorefrontRelations: import('drizzle-orm').Relations<
  'customer_addresses',
  {
    customersInStorefront: import('drizzle-orm').One<'customers', true>;
  }
>;
export declare const customerConsentsInStorefrontRelations: import('drizzle-orm').Relations<
  'customer_consents',
  {
    customersInStorefront: import('drizzle-orm').One<'customers', true>;
  }
>;
export declare const discountCodesInStorefrontRelations: import('drizzle-orm').Relations<
  'discount_codes',
  {
    priceRulesInStorefront: import('drizzle-orm').One<'price_rules', true>;
  }
>;
export declare const priceRulesInStorefrontRelations: import('drizzle-orm').Relations<
  'price_rules',
  {
    discountCodesInStorefronts: import('drizzle-orm').Many<'discount_codes'>;
  }
>;
export declare const faqsInStorefrontRelations: import('drizzle-orm').Relations<
  'faqs',
  {
    faqCategoriesInStorefront: import('drizzle-orm').One<
      'faq_categories',
      false
    >;
  }
>;
export declare const faqCategoriesInStorefrontRelations: import('drizzle-orm').Relations<
  'faq_categories',
  {
    faqsInStorefronts: import('drizzle-orm').Many<'faqs'>;
  }
>;
export declare const flashSaleProductsInStorefrontRelations: import('drizzle-orm').Relations<
  'flash_sale_products',
  {
    flashSalesInStorefront: import('drizzle-orm').One<'flash_sales', false>;
  }
>;
export declare const flashSalesInStorefrontRelations: import('drizzle-orm').Relations<
  'flash_sales',
  {
    flashSaleProductsInStorefronts: import('drizzle-orm').Many<'flash_sale_products'>;
  }
>;
export declare const ordersInStorefrontRelations: import('drizzle-orm').Relations<
  'orders',
  {
    customersInStorefront: import('drizzle-orm').One<'customers', false>;
    fulfillmentsInStorefronts: import('drizzle-orm').Many<'fulfillments'>;
    orderItemsInStorefronts: import('drizzle-orm').Many<'order_items'>;
    orderEditsInStorefronts: import('drizzle-orm').Many<'order_edits'>;
    orderTimelineInStorefronts: import('drizzle-orm').Many<'order_timeline'>;
    refundsInStorefronts: import('drizzle-orm').Many<'refunds'>;
    rmaRequestsInStorefronts: import('drizzle-orm').Many<'rma_requests'>;
  }
>;
export declare const fulfillmentsInStorefrontRelations: import('drizzle-orm').Relations<
  'fulfillments',
  {
    ordersInStorefront: import('drizzle-orm').One<'orders', true>;
    fulfillmentItemsInStorefronts: import('drizzle-orm').Many<'fulfillment_items'>;
  }
>;
export declare const productVariantsInStorefrontRelations: import('drizzle-orm').Relations<
  'product_variants',
  {
    productsInStorefront: import('drizzle-orm').One<'products', true>;
    orderItemsInStorefronts: import('drizzle-orm').Many<'order_items'>;
    inventoryLevelsInStorefronts: import('drizzle-orm').Many<'inventory_levels'>;
    inventoryMovementsInStorefronts: import('drizzle-orm').Many<'inventory_movements'>;
    inventoryReservationsInStorefronts: import('drizzle-orm').Many<'inventory_reservations'>;
    inventoryTransferItemsInStorefronts: import('drizzle-orm').Many<'inventory_transfer_items'>;
    purchaseOrderItemsInStorefronts: import('drizzle-orm').Many<'purchase_order_items'>;
  }
>;
export declare const orderItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'order_items',
  {
    ordersInStorefront: import('drizzle-orm').One<'orders', true>;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      false
    >;
    fulfillmentItemsInStorefronts: import('drizzle-orm').Many<'fulfillment_items'>;
    orderEditsInStorefronts: import('drizzle-orm').Many<'order_edits'>;
    rmaItemsInStorefronts: import('drizzle-orm').Many<'rma_items'>;
    refundItemsInStorefronts: import('drizzle-orm').Many<'refund_items'>;
    rmaRequestsInStorefronts: import('drizzle-orm').Many<'rma_requests'>;
  }
>;
export declare const fulfillmentItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'fulfillment_items',
  {
    fulfillmentsInStorefront: import('drizzle-orm').One<'fulfillments', true>;
    orderItemsInStorefront: import('drizzle-orm').One<'order_items', true>;
  }
>;
export declare const inventoryLevelsInStorefrontRelations: import('drizzle-orm').Relations<
  'inventory_levels',
  {
    locationsInStorefront: import('drizzle-orm').One<'locations', true>;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      true
    >;
  }
>;
export declare const locationsInStorefrontRelations: import('drizzle-orm').Relations<
  'locations',
  {
    inventoryLevelsInStorefronts: import('drizzle-orm').Many<'inventory_levels'>;
    inventoryMovementsInStorefronts: import('drizzle-orm').Many<'inventory_movements'>;
    inventoryReservationsInStorefronts: import('drizzle-orm').Many<'inventory_reservations'>;
    inventoryTransfersInStorefronts_fromLocationId: import('drizzle-orm').Many<'inventory_transfers'>;
    inventoryTransfersInStorefronts_toLocationId: import('drizzle-orm').Many<'inventory_transfers'>;
    purchaseOrdersInStorefronts: import('drizzle-orm').Many<'purchase_orders'>;
  }
>;
export declare const inventoryMovementsInStorefrontRelations: import('drizzle-orm').Relations<
  'inventory_movements',
  {
    locationsInStorefront: import('drizzle-orm').One<'locations', true>;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      true
    >;
  }
>;
export declare const inventoryReservationsInStorefrontRelations: import('drizzle-orm').Relations<
  'inventory_reservations',
  {
    locationsInStorefront: import('drizzle-orm').One<'locations', true>;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      true
    >;
  }
>;
export declare const inventoryTransfersInStorefrontRelations: import('drizzle-orm').Relations<
  'inventory_transfers',
  {
    locationsInStorefront_fromLocationId: import('drizzle-orm').One<
      'locations',
      true
    >;
    locationsInStorefront_toLocationId: import('drizzle-orm').One<
      'locations',
      true
    >;
    inventoryTransferItemsInStorefronts: import('drizzle-orm').Many<'inventory_transfer_items'>;
  }
>;
export declare const inventoryTransferItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'inventory_transfer_items',
  {
    inventoryTransfersInStorefront: import('drizzle-orm').One<
      'inventory_transfers',
      true
    >;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      true
    >;
  }
>;
export declare const orderEditsInStorefrontRelations: import('drizzle-orm').Relations<
  'order_edits',
  {
    orderItemsInStorefront: import('drizzle-orm').One<'order_items', false>;
    ordersInStorefront: import('drizzle-orm').One<'orders', true>;
  }
>;
export declare const kbArticlesInStorefrontRelations: import('drizzle-orm').Relations<
  'kb_articles',
  {
    kbCategoriesInStorefront: import('drizzle-orm').One<'kb_categories', false>;
  }
>;
export declare const kbCategoriesInStorefrontRelations: import('drizzle-orm').Relations<
  'kb_categories',
  {
    kbArticlesInStorefronts: import('drizzle-orm').Many<'kb_articles'>;
  }
>;
export declare const orderTimelineInStorefrontRelations: import('drizzle-orm').Relations<
  'order_timeline',
  {
    ordersInStorefront: import('drizzle-orm').One<'orders', false>;
  }
>;
export declare const productBundleItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'product_bundle_items',
  {
    productBundlesInStorefront: import('drizzle-orm').One<
      'product_bundles',
      true
    >;
  }
>;
export declare const productBundlesInStorefrontRelations: import('drizzle-orm').Relations<
  'product_bundles',
  {
    productBundleItemsInStorefronts: import('drizzle-orm').Many<'product_bundle_items'>;
  }
>;
export declare const priceListsInStorefrontRelations: import('drizzle-orm').Relations<
  'price_lists',
  {
    marketsInStorefront: import('drizzle-orm').One<'markets', true>;
  }
>;
export declare const marketsInStorefrontRelations: import('drizzle-orm').Relations<
  'markets',
  {
    priceListsInStorefronts: import('drizzle-orm').Many<'price_lists'>;
  }
>;
export declare const productAttributesInStorefrontRelations: import('drizzle-orm').Relations<
  'product_attributes',
  {
    productsInStorefront: import('drizzle-orm').One<'products', true>;
  }
>;
export declare const productImagesInStorefrontRelations: import('drizzle-orm').Relations<
  'product_images',
  {
    productsInStorefront: import('drizzle-orm').One<'products', true>;
  }
>;
export declare const purchaseOrdersInStorefrontRelations: import('drizzle-orm').Relations<
  'purchase_orders',
  {
    locationsInStorefront: import('drizzle-orm').One<'locations', true>;
    suppliersInStorefront: import('drizzle-orm').One<'suppliers', true>;
    purchaseOrderItemsInStorefronts: import('drizzle-orm').Many<'purchase_order_items'>;
  }
>;
export declare const suppliersInStorefrontRelations: import('drizzle-orm').Relations<
  'suppliers',
  {
    purchaseOrdersInStorefronts: import('drizzle-orm').Many<'purchase_orders'>;
  }
>;
export declare const purchaseOrderItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'purchase_order_items',
  {
    purchaseOrdersInStorefront: import('drizzle-orm').One<
      'purchase_orders',
      true
    >;
    productVariantsInStorefront: import('drizzle-orm').One<
      'product_variants',
      true
    >;
  }
>;
export declare const rmaItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'rma_items',
  {
    orderItemsInStorefront: import('drizzle-orm').One<'order_items', true>;
    rmaRequestsInStorefront: import('drizzle-orm').One<'rma_requests', true>;
  }
>;
export declare const rmaRequestsInStorefrontRelations: import('drizzle-orm').Relations<
  'rma_requests',
  {
    rmaItemsInStorefronts: import('drizzle-orm').Many<'rma_items'>;
    ordersInStorefront: import('drizzle-orm').One<'orders', true>;
    orderItemsInStorefront: import('drizzle-orm').One<'order_items', false>;
  }
>;
export declare const refundsInStorefrontRelations: import('drizzle-orm').Relations<
  'refunds',
  {
    ordersInStorefront: import('drizzle-orm').One<'orders', true>;
    refundItemsInStorefronts: import('drizzle-orm').Many<'refund_items'>;
  }
>;
export declare const refundItemsInStorefrontRelations: import('drizzle-orm').Relations<
  'refund_items',
  {
    orderItemsInStorefront: import('drizzle-orm').One<'order_items', true>;
    refundsInStorefront: import('drizzle-orm').One<'refunds', true>;
  }
>;
export declare const staffMembersInStorefrontRelations: import('drizzle-orm').Relations<
  'staff_members',
  {
    staffRolesInStorefront: import('drizzle-orm').One<'staff_roles', true>;
    staffSessionsInStorefronts: import('drizzle-orm').Many<'staff_sessions'>;
  }
>;
export declare const staffRolesInStorefrontRelations: import('drizzle-orm').Relations<
  'staff_roles',
  {
    staffMembersInStorefronts: import('drizzle-orm').Many<'staff_members'>;
  }
>;
export declare const staffSessionsInStorefrontRelations: import('drizzle-orm').Relations<
  'staff_sessions',
  {
    staffMembersInStorefront: import('drizzle-orm').One<'staff_members', true>;
  }
>;
export declare const taxRulesInStorefrontRelations: import('drizzle-orm').Relations<
  'tax_rules',
  {
    taxCategoriesInStorefront: import('drizzle-orm').One<
      'tax_categories',
      false
    >;
  }
>;
export declare const taxCategoriesInStorefrontRelations: import('drizzle-orm').Relations<
  'tax_categories',
  {
    taxRulesInStorefronts: import('drizzle-orm').Many<'tax_rules'>;
  }
>;
export declare const webhookSubscriptionsInStorefrontRelations: import('drizzle-orm').Relations<
  'webhook_subscriptions',
  {
    appInstallationsInStorefront: import('drizzle-orm').One<
      'app_installations',
      true
    >;
  }
>;
export declare const appInstallationsInStorefrontRelations: import('drizzle-orm').Relations<
  'app_installations',
  {
    webhookSubscriptionsInStorefronts: import('drizzle-orm').Many<'webhook_subscriptions'>;
  }
>;
//# sourceMappingURL=relations.d.ts.map
