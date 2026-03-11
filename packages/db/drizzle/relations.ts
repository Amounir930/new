import { relations } from 'drizzle-orm/relations';
import {
  abandonedCheckoutsInStorefront,
  affiliatePartnersInStorefront,
  affiliateTransactionsInStorefront,
  appInstallationsInStorefront,
  b2BCompaniesInStorefront,
  b2BPricingTiersInStorefront,
  b2BUsersInStorefront,
  blogCategoriesInStorefront,
  blogPostsInStorefront,
  brandsInStorefront,
  cartItemsInStorefront,
  cartsInStorefront,
  categories,
  categoriesInStorefront,
  couponsInStorefront,
  couponUsagesInStorefront,
  customerAddressesInStorefront,
  customerConsentsInStorefront,
  customersInStorefront,
  discountCodesInStorefront,
  faqCategoriesInStorefront,
  faqsInStorefront,
  flashSaleProductsInStorefront,
  flashSalesInStorefront,
  fulfillmentItemsInStorefront,
  fulfillmentsInStorefront,
  inventoryLevelsInStorefront,
  inventoryMovementsInStorefront,
  inventoryReservationsInStorefront,
  inventoryTransferItemsInStorefront,
  inventoryTransfersInStorefront,
  kbArticlesInStorefront,
  kbCategoriesInStorefront,
  locationsInStorefront,
  marketsInStorefront,
  orderEditsInStorefront,
  orderItemsInStorefront,
  ordersInStorefront,
  orderTimelineInStorefront,
  priceListsInStorefront,
  priceRulesInStorefront,
  productAttributesInStorefront,
  productBundleItemsInStorefront,
  productBundlesInStorefront,
  productImagesInStorefront,
  productsInStorefront,
  productVariantsInStorefront,
  purchaseOrderItemsInStorefront,
  purchaseOrdersInStorefront,
  refundItemsInStorefront,
  refundsInStorefront,
  rmaItemsInStorefront,
  rmaRequestsInStorefront,
  staffMembersInStorefront,
  staffRolesInStorefront,
  staffSessionsInStorefront,
  suppliersInStorefront,
  taxCategoriesInStorefront,
  taxRulesInStorefront,
  webhookSubscriptionsInStorefront,
} from './schema';

export const abandonedCheckoutsInStorefrontRelations = relations(
  abandonedCheckoutsInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [abandonedCheckoutsInStorefront.customerId],
      references: [customersInStorefront.id],
    }),
  })
);

export const customersInStorefrontRelations = relations(
  customersInStorefront,
  ({ many }) => ({
    abandonedCheckoutsInStorefronts: many(abandonedCheckoutsInStorefront),
    cartsInStorefronts: many(cartsInStorefront),
    customerAddressesInStorefronts: many(customerAddressesInStorefront),
    customerConsentsInStorefronts: many(customerConsentsInStorefront),
    ordersInStorefronts: many(ordersInStorefront),
  })
);

export const affiliateTransactionsInStorefrontRelations = relations(
  affiliateTransactionsInStorefront,
  ({ one }) => ({
    affiliatePartnersInStorefront: one(affiliatePartnersInStorefront, {
      fields: [affiliateTransactionsInStorefront.partnerId],
      references: [affiliatePartnersInStorefront.id],
    }),
  })
);

export const affiliatePartnersInStorefrontRelations = relations(
  affiliatePartnersInStorefront,
  ({ many }) => ({
    affiliateTransactionsInStorefronts: many(affiliateTransactionsInStorefront),
  })
);

export const categoriesInStorefrontRelations = relations(
  categoriesInStorefront,
  ({ one, many }) => ({
    categoriesInStorefront: one(categoriesInStorefront, {
      fields: [categoriesInStorefront.parentId],
      references: [categoriesInStorefront.id],
      relationName: 'categoriesInStorefront_parentId_categoriesInStorefront_id',
    }),
    categoriesInStorefronts: many(categoriesInStorefront, {
      relationName: 'categoriesInStorefront_parentId_categoriesInStorefront_id',
    }),
    productsInStorefronts: many(productsInStorefront),
  })
);

export const productsInStorefrontRelations = relations(
  productsInStorefront,
  ({ one, many }) => ({
    brandsInStorefront: one(brandsInStorefront, {
      fields: [productsInStorefront.brandId],
      references: [brandsInStorefront.id],
    }),
    categoriesInStorefront: one(categoriesInStorefront, {
      fields: [productsInStorefront.categoryId],
      references: [categoriesInStorefront.id],
    }),
    b2BPricingTiersInStorefronts: many(b2BPricingTiersInStorefront),
    productVariantsInStorefronts: many(productVariantsInStorefront),
    productAttributesInStorefronts: many(productAttributesInStorefront),
    productImagesInStorefronts: many(productImagesInStorefront),
  })
);

export const brandsInStorefrontRelations = relations(
  brandsInStorefront,
  ({ many }) => ({
    productsInStorefronts: many(productsInStorefront),
  })
);

export const b2BPricingTiersInStorefrontRelations = relations(
  b2BPricingTiersInStorefront,
  ({ one }) => ({
    b2BCompaniesInStorefront: one(b2BCompaniesInStorefront, {
      fields: [b2BPricingTiersInStorefront.companyId],
      references: [b2BCompaniesInStorefront.id],
    }),
    productsInStorefront: one(productsInStorefront, {
      fields: [b2BPricingTiersInStorefront.productId],
      references: [productsInStorefront.id],
    }),
  })
);

export const b2BCompaniesInStorefrontRelations = relations(
  b2BCompaniesInStorefront,
  ({ many }) => ({
    b2BPricingTiersInStorefronts: many(b2BPricingTiersInStorefront),
    b2BUsersInStorefronts: many(b2BUsersInStorefront),
  })
);

export const b2BUsersInStorefrontRelations = relations(
  b2BUsersInStorefront,
  ({ one }) => ({
    b2BCompaniesInStorefront: one(b2BCompaniesInStorefront, {
      fields: [b2BUsersInStorefront.companyId],
      references: [b2BCompaniesInStorefront.id],
    }),
  })
);

export const blogPostsInStorefrontRelations = relations(
  blogPostsInStorefront,
  ({ one }) => ({
    blogCategoriesInStorefront: one(blogCategoriesInStorefront, {
      fields: [blogPostsInStorefront.categoryId],
      references: [blogCategoriesInStorefront.id],
    }),
  })
);

export const blogCategoriesInStorefrontRelations = relations(
  blogCategoriesInStorefront,
  ({ many }) => ({
    blogPostsInStorefronts: many(blogPostsInStorefront),
  })
);

export const cartsInStorefrontRelations = relations(
  cartsInStorefront,
  ({ one, many }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [cartsInStorefront.customerId],
      references: [customersInStorefront.id],
    }),
    cartItemsInStorefronts: many(cartItemsInStorefront),
  })
);

export const cartItemsInStorefrontRelations = relations(
  cartItemsInStorefront,
  ({ one }) => ({
    cartsInStorefront: one(cartsInStorefront, {
      fields: [cartItemsInStorefront.cartId],
      references: [cartsInStorefront.id],
    }),
  })
);

export const couponUsagesInStorefrontRelations = relations(
  couponUsagesInStorefront,
  ({ one }) => ({
    couponsInStorefront: one(couponsInStorefront, {
      fields: [couponUsagesInStorefront.couponId],
      references: [couponsInStorefront.id],
    }),
  })
);

export const couponsInStorefrontRelations = relations(
  couponsInStorefront,
  ({ many }) => ({
    couponUsagesInStorefronts: many(couponUsagesInStorefront),
  })
);

export const customerAddressesInStorefrontRelations = relations(
  customerAddressesInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [customerAddressesInStorefront.customerId],
      references: [customersInStorefront.id],
    }),
  })
);

export const customerConsentsInStorefrontRelations = relations(
  customerConsentsInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [customerConsentsInStorefront.customerId],
      references: [customersInStorefront.id],
    }),
  })
);

export const discountCodesInStorefrontRelations = relations(
  discountCodesInStorefront,
  ({ one }) => ({
    priceRulesInStorefront: one(priceRulesInStorefront, {
      fields: [discountCodesInStorefront.priceRuleId],
      references: [priceRulesInStorefront.id],
    }),
  })
);

export const priceRulesInStorefrontRelations = relations(
  priceRulesInStorefront,
  ({ many }) => ({
    discountCodesInStorefronts: many(discountCodesInStorefront),
  })
);

export const faqsInStorefrontRelations = relations(
  faqsInStorefront,
  ({ one }) => ({
    faqCategoriesInStorefront: one(faqCategoriesInStorefront, {
      fields: [faqsInStorefront.categoryId],
      references: [faqCategoriesInStorefront.id],
    }),
  })
);

export const faqCategoriesInStorefrontRelations = relations(
  faqCategoriesInStorefront,
  ({ many }) => ({
    faqsInStorefronts: many(faqsInStorefront),
  })
);

export const flashSaleProductsInStorefrontRelations = relations(
  flashSaleProductsInStorefront,
  ({ one }) => ({
    flashSalesInStorefront: one(flashSalesInStorefront, {
      fields: [flashSaleProductsInStorefront.flashSaleId],
      references: [flashSalesInStorefront.id],
    }),
  })
);

export const flashSalesInStorefrontRelations = relations(
  flashSalesInStorefront,
  ({ many }) => ({
    flashSaleProductsInStorefronts: many(flashSaleProductsInStorefront),
  })
);

export const ordersInStorefrontRelations = relations(
  ordersInStorefront,
  ({ one, many }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [ordersInStorefront.customerId],
      references: [customersInStorefront.id],
    }),
    fulfillmentsInStorefronts: many(fulfillmentsInStorefront),
    orderItemsInStorefronts: many(orderItemsInStorefront),
    orderEditsInStorefronts: many(orderEditsInStorefront),
    orderTimelineInStorefronts: many(orderTimelineInStorefront),
    refundsInStorefronts: many(refundsInStorefront),
    rmaRequestsInStorefronts: many(rmaRequestsInStorefront),
  })
);

export const fulfillmentsInStorefrontRelations = relations(
  fulfillmentsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [fulfillmentsInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
    fulfillmentItemsInStorefronts: many(fulfillmentItemsInStorefront),
  })
);

export const productVariantsInStorefrontRelations = relations(
  productVariantsInStorefront,
  ({ one, many }) => ({
    productsInStorefront: one(productsInStorefront, {
      fields: [productVariantsInStorefront.productId],
      references: [productsInStorefront.id],
    }),
    orderItemsInStorefronts: many(orderItemsInStorefront),
    inventoryLevelsInStorefronts: many(inventoryLevelsInStorefront),
    inventoryMovementsInStorefronts: many(inventoryMovementsInStorefront),
    inventoryReservationsInStorefronts: many(inventoryReservationsInStorefront),
    inventoryTransferItemsInStorefronts: many(
      inventoryTransferItemsInStorefront
    ),
    purchaseOrderItemsInStorefronts: many(purchaseOrderItemsInStorefront),
  })
);

export const orderItemsInStorefrontRelations = relations(
  orderItemsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [orderItemsInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [orderItemsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
    fulfillmentItemsInStorefronts: many(fulfillmentItemsInStorefront),
    orderEditsInStorefronts: many(orderEditsInStorefront),
    rmaItemsInStorefronts: many(rmaItemsInStorefront),
    refundItemsInStorefronts: many(refundItemsInStorefront),
    rmaRequestsInStorefronts: many(rmaRequestsInStorefront),
  })
);

export const fulfillmentItemsInStorefrontRelations = relations(
  fulfillmentItemsInStorefront,
  ({ one }) => ({
    fulfillmentsInStorefront: one(fulfillmentsInStorefront, {
      fields: [fulfillmentItemsInStorefront.fulfillmentId],
      references: [fulfillmentsInStorefront.id],
    }),
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [fulfillmentItemsInStorefront.orderItemId],
      references: [orderItemsInStorefront.id],
    }),
  })
);

export const inventoryLevelsInStorefrontRelations = relations(
  inventoryLevelsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [inventoryLevelsInStorefront.locationId],
      references: [locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [inventoryLevelsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
  })
);

export const locationsInStorefrontRelations = relations(
  locationsInStorefront,
  ({ many }) => ({
    inventoryLevelsInStorefronts: many(inventoryLevelsInStorefront),
    inventoryMovementsInStorefronts: many(inventoryMovementsInStorefront),
    inventoryReservationsInStorefronts: many(inventoryReservationsInStorefront),
    inventoryTransfersInStorefronts_fromLocationId: many(
      inventoryTransfersInStorefront,
      {
        relationName:
          'inventoryTransfersInStorefront_fromLocationId_locationsInStorefront_id',
      }
    ),
    inventoryTransfersInStorefronts_toLocationId: many(
      inventoryTransfersInStorefront,
      {
        relationName:
          'inventoryTransfersInStorefront_toLocationId_locationsInStorefront_id',
      }
    ),
    purchaseOrdersInStorefronts: many(purchaseOrdersInStorefront),
  })
);

export const inventoryMovementsInStorefrontRelations = relations(
  inventoryMovementsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [inventoryMovementsInStorefront.locationId],
      references: [locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [inventoryMovementsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
  })
);

export const inventoryReservationsInStorefrontRelations = relations(
  inventoryReservationsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [inventoryReservationsInStorefront.locationId],
      references: [locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [inventoryReservationsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
  })
);

export const inventoryTransfersInStorefrontRelations = relations(
  inventoryTransfersInStorefront,
  ({ one, many }) => ({
    locationsInStorefront_fromLocationId: one(locationsInStorefront, {
      fields: [inventoryTransfersInStorefront.fromLocationId],
      references: [locationsInStorefront.id],
      relationName:
        'inventoryTransfersInStorefront_fromLocationId_locationsInStorefront_id',
    }),
    locationsInStorefront_toLocationId: one(locationsInStorefront, {
      fields: [inventoryTransfersInStorefront.toLocationId],
      references: [locationsInStorefront.id],
      relationName:
        'inventoryTransfersInStorefront_toLocationId_locationsInStorefront_id',
    }),
    inventoryTransferItemsInStorefronts: many(
      inventoryTransferItemsInStorefront
    ),
  })
);

export const inventoryTransferItemsInStorefrontRelations = relations(
  inventoryTransferItemsInStorefront,
  ({ one }) => ({
    inventoryTransfersInStorefront: one(inventoryTransfersInStorefront, {
      fields: [inventoryTransferItemsInStorefront.transferId],
      references: [inventoryTransfersInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [inventoryTransferItemsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
  })
);

export const orderEditsInStorefrontRelations = relations(
  orderEditsInStorefront,
  ({ one }) => ({
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [orderEditsInStorefront.lineItemId],
      references: [orderItemsInStorefront.id],
    }),
    ordersInStorefront: one(ordersInStorefront, {
      fields: [orderEditsInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
  })
);

export const kbArticlesInStorefrontRelations = relations(
  kbArticlesInStorefront,
  ({ one }) => ({
    kbCategoriesInStorefront: one(kbCategoriesInStorefront, {
      fields: [kbArticlesInStorefront.categoryId],
      references: [kbCategoriesInStorefront.id],
    }),
  })
);

export const kbCategoriesInStorefrontRelations = relations(
  kbCategoriesInStorefront,
  ({ many }) => ({
    kbArticlesInStorefronts: many(kbArticlesInStorefront),
  })
);

export const orderTimelineInStorefrontRelations = relations(
  orderTimelineInStorefront,
  ({ one }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [orderTimelineInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
  })
);

export const productBundleItemsInStorefrontRelations = relations(
  productBundleItemsInStorefront,
  ({ one }) => ({
    productBundlesInStorefront: one(productBundlesInStorefront, {
      fields: [productBundleItemsInStorefront.bundleId],
      references: [productBundlesInStorefront.id],
    }),
  })
);

export const productBundlesInStorefrontRelations = relations(
  productBundlesInStorefront,
  ({ many }) => ({
    productBundleItemsInStorefronts: many(productBundleItemsInStorefront),
  })
);

export const priceListsInStorefrontRelations = relations(
  priceListsInStorefront,
  ({ one }) => ({
    marketsInStorefront: one(marketsInStorefront, {
      fields: [priceListsInStorefront.marketId],
      references: [marketsInStorefront.id],
    }),
  })
);

export const marketsInStorefrontRelations = relations(
  marketsInStorefront,
  ({ many }) => ({
    priceListsInStorefronts: many(priceListsInStorefront),
  })
);

export const productAttributesInStorefrontRelations = relations(
  productAttributesInStorefront,
  ({ one }) => ({
    productsInStorefront: one(productsInStorefront, {
      fields: [productAttributesInStorefront.productId],
      references: [productsInStorefront.id],
    }),
  })
);

export const productImagesInStorefrontRelations = relations(
  productImagesInStorefront,
  ({ one }) => ({
    productsInStorefront: one(productsInStorefront, {
      fields: [productImagesInStorefront.productId],
      references: [productsInStorefront.id],
    }),
  })
);

export const purchaseOrdersInStorefrontRelations = relations(
  purchaseOrdersInStorefront,
  ({ one, many }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [purchaseOrdersInStorefront.locationId],
      references: [locationsInStorefront.id],
    }),
    suppliersInStorefront: one(suppliersInStorefront, {
      fields: [purchaseOrdersInStorefront.supplierId],
      references: [suppliersInStorefront.id],
    }),
    purchaseOrderItemsInStorefronts: many(purchaseOrderItemsInStorefront),
  })
);

export const suppliersInStorefrontRelations = relations(
  suppliersInStorefront,
  ({ many }) => ({
    purchaseOrdersInStorefronts: many(purchaseOrdersInStorefront),
  })
);

export const purchaseOrderItemsInStorefrontRelations = relations(
  purchaseOrderItemsInStorefront,
  ({ one }) => ({
    purchaseOrdersInStorefront: one(purchaseOrdersInStorefront, {
      fields: [purchaseOrderItemsInStorefront.poId],
      references: [purchaseOrdersInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [purchaseOrderItemsInStorefront.variantId],
      references: [productVariantsInStorefront.id],
    }),
  })
);

export const rmaItemsInStorefrontRelations = relations(
  rmaItemsInStorefront,
  ({ one }) => ({
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [rmaItemsInStorefront.orderItemId],
      references: [orderItemsInStorefront.id],
    }),
    rmaRequestsInStorefront: one(rmaRequestsInStorefront, {
      fields: [rmaItemsInStorefront.rmaId],
      references: [rmaRequestsInStorefront.id],
    }),
  })
);

export const rmaRequestsInStorefrontRelations = relations(
  rmaRequestsInStorefront,
  ({ one, many }) => ({
    rmaItemsInStorefronts: many(rmaItemsInStorefront),
    ordersInStorefront: one(ordersInStorefront, {
      fields: [rmaRequestsInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [rmaRequestsInStorefront.orderItemId],
      references: [orderItemsInStorefront.id],
    }),
  })
);

export const refundsInStorefrontRelations = relations(
  refundsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [refundsInStorefront.orderId],
      references: [ordersInStorefront.id],
    }),
    refundItemsInStorefronts: many(refundItemsInStorefront),
  })
);

export const refundItemsInStorefrontRelations = relations(
  refundItemsInStorefront,
  ({ one }) => ({
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [refundItemsInStorefront.orderItemId],
      references: [orderItemsInStorefront.id],
    }),
    refundsInStorefront: one(refundsInStorefront, {
      fields: [refundItemsInStorefront.refundId],
      references: [refundsInStorefront.id],
    }),
  })
);

export const staffMembersInStorefrontRelations = relations(
  staffMembersInStorefront,
  ({ one, many }) => ({
    staffRolesInStorefront: one(staffRolesInStorefront, {
      fields: [staffMembersInStorefront.roleId],
      references: [staffRolesInStorefront.id],
    }),
    staffSessionsInStorefronts: many(staffSessionsInStorefront),
  })
);

export const staffRolesInStorefrontRelations = relations(
  staffRolesInStorefront,
  ({ many }) => ({
    staffMembersInStorefronts: many(staffMembersInStorefront),
  })
);

export const staffSessionsInStorefrontRelations = relations(
  staffSessionsInStorefront,
  ({ one }) => ({
    staffMembersInStorefront: one(staffMembersInStorefront, {
      fields: [staffSessionsInStorefront.staffId],
      references: [staffMembersInStorefront.id],
    }),
  })
);

export const taxRulesInStorefrontRelations = relations(
  taxRulesInStorefront,
  ({ one }) => ({
    taxCategoriesInStorefront: one(taxCategoriesInStorefront, {
      fields: [taxRulesInStorefront.taxCategoryId],
      references: [taxCategoriesInStorefront.id],
    }),
  })
);

export const taxCategoriesInStorefrontRelations = relations(
  taxCategoriesInStorefront,
  ({ many }) => ({
    taxRulesInStorefronts: many(taxRulesInStorefront),
  })
);

export const webhookSubscriptionsInStorefrontRelations = relations(
  webhookSubscriptionsInStorefront,
  ({ one }) => ({
    appInstallationsInStorefront: one(appInstallationsInStorefront, {
      fields: [webhookSubscriptionsInStorefront.appId],
      references: [appInstallationsInStorefront.id],
    }),
  })
);

export const appInstallationsInStorefrontRelations = relations(
  appInstallationsInStorefront,
  ({ many }) => ({
    webhookSubscriptionsInStorefronts: many(webhookSubscriptionsInStorefront),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  category: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categories_parentId_categories_id',
  }),
  categories: many(categories, {
    relationName: 'categories_parentId_categories_id',
  }),
}));
