import { relations } from 'drizzle-orm/relations';
import {
  abandonedCheckoutsInStorefront,
  affiliatePartnersInStorefront,
  affiliateTransactionsInStorefront,
  appInstallationsInStorefront,
  b2BCompaniesInStorefront,
  b2BPricingTiersInStorefront,
  b2BUsersInStorefront,
  brandsInStorefront,
  cartItemsInStorefront,
  cartsInStorefront,
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
  partConfig,
  partConfigSub,
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
  shippingMethodsInStorefront,
  shippingRatesInStorefront,
  shippingZonesInStorefront,
  staffMembersInStorefront,
  staffRolesInStorefront,
  staffSessionsInStorefront,
  suppliersInStorefront,
  taxCategoriesInStorefront,
  taxRulesInStorefront,
  tenantsInGovernance,
  webhookSubscriptionsInStorefront,
} from './schema';

export const partConfigSubRelations = relations(partConfigSub, ({ one }) => ({
  partConfig: one(partConfig, {
    fields: [partConfigSub.subParent],
    references: [partConfig.parentTable],
  }),
}));

export const partConfigRelations = relations(partConfig, ({ many }) => ({
  partConfigSubs: many(partConfigSub),
}));

export const categoriesInStorefrontRelations = relations(
  categoriesInStorefront,
  ({ one, many }) => ({
    categoriesInStorefront: one(categoriesInStorefront, {
      fields: [
        categoriesInStorefront.tenantId,
        categoriesInStorefront.parentId,
      ],
      references: [categoriesInStorefront.tenantId, categoriesInStorefront.id],
      relationName: 'categoriesInStorefront_parentId_categoriesInStorefront_id',
    }),
    categoriesInStorefronts: many(categoriesInStorefront, {
      relationName: 'categoriesInStorefront_tenantId_categoriesInStorefront_id',
    }),
    productsInStorefronts: many(productsInStorefront),
  })
);

export const abandonedCheckoutsInStorefrontRelations = relations(
  abandonedCheckoutsInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [
        abandonedCheckoutsInStorefront.tenantId,
        abandonedCheckoutsInStorefront.customerId,
      ],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
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
    ordersInStorefronts_tenantId: many(ordersInStorefront, {
      relationName: 'ordersInStorefront_tenantId_customersInStorefront_id',
    }),
    ordersInStorefronts_customerId: many(ordersInStorefront, {
      relationName: 'ordersInStorefront_customerId_customersInStorefront_id',
    }),
  })
);

export const affiliateTransactionsInStorefrontRelations = relations(
  affiliateTransactionsInStorefront,
  ({ one }) => ({
    affiliatePartnersInStorefront: one(affiliatePartnersInStorefront, {
      fields: [
        affiliateTransactionsInStorefront.tenantId,
        affiliateTransactionsInStorefront.partnerId,
      ],
      references: [
        affiliatePartnersInStorefront.tenantId,
        affiliatePartnersInStorefront.id,
      ],
    }),
  })
);

export const affiliatePartnersInStorefrontRelations = relations(
  affiliatePartnersInStorefront,
  ({ many }) => ({
    affiliateTransactionsInStorefronts: many(affiliateTransactionsInStorefront),
  })
);

export const b2BPricingTiersInStorefrontRelations = relations(
  b2BPricingTiersInStorefront,
  ({ one }) => ({
    b2BCompaniesInStorefront: one(b2BCompaniesInStorefront, {
      fields: [
        b2BPricingTiersInStorefront.tenantId,
        b2BPricingTiersInStorefront.companyId,
      ],
      references: [
        b2BCompaniesInStorefront.tenantId,
        b2BCompaniesInStorefront.id,
      ],
    }),
    productsInStorefront: one(productsInStorefront, {
      fields: [
        b2BPricingTiersInStorefront.tenantId,
        b2BPricingTiersInStorefront.productId,
      ],
      references: [productsInStorefront.tenantId, productsInStorefront.id],
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

export const productsInStorefrontRelations = relations(
  productsInStorefront,
  ({ one, many }) => ({
    b2BPricingTiersInStorefronts: many(b2BPricingTiersInStorefront),
    brandsInStorefront: one(brandsInStorefront, {
      fields: [productsInStorefront.brandId],
      references: [brandsInStorefront.id],
    }),
    categoriesInStorefront: one(categoriesInStorefront, {
      fields: [productsInStorefront.categoryId],
      references: [categoriesInStorefront.id],
    }),
    productAttributesInStorefronts: many(productAttributesInStorefront),
    productImagesInStorefronts: many(productImagesInStorefront),
    productVariantsInStorefronts: many(productVariantsInStorefront),
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

export const brandsInStorefrontRelations = relations(
  brandsInStorefront,
  ({ many }) => ({
    productsInStorefronts: many(productsInStorefront),
  })
);

export const cartsInStorefrontRelations = relations(
  cartsInStorefront,
  ({ one, many }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [cartsInStorefront.tenantId, cartsInStorefront.customerId],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
    }),
    cartItemsInStorefronts: many(cartItemsInStorefront),
  })
);

export const customerAddressesInStorefrontRelations = relations(
  customerAddressesInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [
        customerAddressesInStorefront.tenantId,
        customerAddressesInStorefront.customerId,
      ],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
    }),
  })
);

export const cartItemsInStorefrontRelations = relations(
  cartItemsInStorefront,
  ({ one }) => ({
    cartsInStorefront: one(cartsInStorefront, {
      fields: [cartItemsInStorefront.tenantId, cartItemsInStorefront.cartId],
      references: [cartsInStorefront.tenantId, cartsInStorefront.id],
    }),
  })
);

export const customerConsentsInStorefrontRelations = relations(
  customerConsentsInStorefront,
  ({ one }) => ({
    customersInStorefront: one(customersInStorefront, {
      fields: [
        customerConsentsInStorefront.tenantId,
        customerConsentsInStorefront.customerId,
      ],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
    }),
  })
);

export const discountCodesInStorefrontRelations = relations(
  discountCodesInStorefront,
  ({ one }) => ({
    priceRulesInStorefront: one(priceRulesInStorefront, {
      fields: [
        discountCodesInStorefront.tenantId,
        discountCodesInStorefront.priceRuleId,
      ],
      references: [priceRulesInStorefront.tenantId, priceRulesInStorefront.id],
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

export const ordersInStorefrontRelations = relations(
  ordersInStorefront,
  ({ one, many }) => ({
    customersInStorefront_tenantId: one(customersInStorefront, {
      fields: [ordersInStorefront.tenantId, ordersInStorefront.customerId],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
      relationName: 'ordersInStorefront_customerId_customersInStorefront_id',
    }),
    customersInStorefront_customerId: one(customersInStorefront, {
      fields: [ordersInStorefront.tenantId, ordersInStorefront.customerId],
      references: [customersInStorefront.tenantId, customersInStorefront.id],
      relationName: 'ordersInStorefront_customerId_customersInStorefront_id',
    }),
    fulfillmentsInStorefronts: many(fulfillmentsInStorefront),
    orderItemsInStorefronts: many(orderItemsInStorefront),
    orderEditsInStorefronts: many(orderEditsInStorefront),
    orderTimelineInStorefronts: many(orderTimelineInStorefront),
    refundsInStorefronts_tenantId: many(refundsInStorefront, {
      relationName: 'refundsInStorefront_tenantId_ordersInStorefront_id',
    }),
    refundsInStorefronts_orderId: many(refundsInStorefront, {
      relationName: 'refundsInStorefront_orderId_ordersInStorefront_id',
    }),
    rmaRequestsInStorefronts: many(rmaRequestsInStorefront),
  })
);

export const flashSaleProductsInStorefrontRelations = relations(
  flashSaleProductsInStorefront,
  ({ one }) => ({
    flashSalesInStorefront: one(flashSalesInStorefront, {
      fields: [
        flashSaleProductsInStorefront.tenantId,
        flashSaleProductsInStorefront.flashSaleId,
      ],
      references: [flashSalesInStorefront.tenantId, flashSalesInStorefront.id],
    }),
  })
);

export const flashSalesInStorefrontRelations = relations(
  flashSalesInStorefront,
  ({ many }) => ({
    flashSaleProductsInStorefronts: many(flashSaleProductsInStorefront),
  })
);

export const fulfillmentsInStorefrontRelations = relations(
  fulfillmentsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [
        fulfillmentsInStorefront.tenantId,
        fulfillmentsInStorefront.orderId,
      ],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
    }),
    fulfillmentItemsInStorefronts: many(fulfillmentItemsInStorefront),
  })
);

export const inventoryLevelsInStorefrontRelations = relations(
  inventoryLevelsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [
        inventoryLevelsInStorefront.tenantId,
        inventoryLevelsInStorefront.locationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [
        inventoryLevelsInStorefront.tenantId,
        inventoryLevelsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
  })
);

export const locationsInStorefrontRelations = relations(
  locationsInStorefront,
  ({ many }) => ({
    inventoryLevelsInStorefronts: many(inventoryLevelsInStorefront),
    inventoryReservationsInStorefronts: many(inventoryReservationsInStorefront),
    inventoryMovementsInStorefronts: many(inventoryMovementsInStorefront),
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

export const productVariantsInStorefrontRelations = relations(
  productVariantsInStorefront,
  ({ one, many }) => ({
    inventoryLevelsInStorefronts: many(inventoryLevelsInStorefront),
    orderItemsInStorefronts: many(orderItemsInStorefront),
    inventoryReservationsInStorefronts: many(inventoryReservationsInStorefront),
    inventoryMovementsInStorefronts: many(inventoryMovementsInStorefront),
    purchaseOrderItemsInStorefronts: many(purchaseOrderItemsInStorefront),
    productsInStorefront: one(productsInStorefront, {
      fields: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.productId,
      ],
      references: [productsInStorefront.tenantId, productsInStorefront.id],
    }),
    inventoryTransferItemsInStorefronts: many(
      inventoryTransferItemsInStorefront
    ),
  })
);

export const orderItemsInStorefrontRelations = relations(
  orderItemsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [orderItemsInStorefront.tenantId, orderItemsInStorefront.orderId],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [
        orderItemsInStorefront.tenantId,
        orderItemsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
    fulfillmentItemsInStorefronts: many(fulfillmentItemsInStorefront),
    orderEditsInStorefronts: many(orderEditsInStorefront),
    refundItemsInStorefronts: many(refundItemsInStorefront),
    rmaRequestsInStorefronts: many(rmaRequestsInStorefront),
    rmaItemsInStorefronts: many(rmaItemsInStorefront),
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

export const inventoryReservationsInStorefrontRelations = relations(
  inventoryReservationsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [
        inventoryReservationsInStorefront.tenantId,
        inventoryReservationsInStorefront.locationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [
        inventoryReservationsInStorefront.tenantId,
        inventoryReservationsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
  })
);

export const inventoryMovementsInStorefrontRelations = relations(
  inventoryMovementsInStorefront,
  ({ one }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [
        inventoryMovementsInStorefront.tenantId,
        inventoryMovementsInStorefront.locationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [
        inventoryMovementsInStorefront.tenantId,
        inventoryMovementsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
  })
);

export const inventoryTransfersInStorefrontRelations = relations(
  inventoryTransfersInStorefront,
  ({ one, many }) => ({
    locationsInStorefront_tenantId: one(locationsInStorefront, {
      fields: [
        inventoryTransfersInStorefront.tenantId,
        inventoryTransfersInStorefront.fromLocationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
      relationName:
        'inventoryTransfersInStorefront_fromLocationId_locationsInStorefront_id',
    }),
    locationsInStorefront_toLocationId: one(locationsInStorefront, {
      fields: [
        inventoryTransfersInStorefront.tenantId,
        inventoryTransfersInStorefront.toLocationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
      relationName:
        'inventoryTransfersInStorefront_toLocationId_locationsInStorefront_id',
    }),
    inventoryTransferItemsInStorefronts: many(
      inventoryTransferItemsInStorefront
    ),
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

export const orderEditsInStorefrontRelations = relations(
  orderEditsInStorefront,
  ({ one }) => ({
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [orderEditsInStorefront.lineItemId],
      references: [orderItemsInStorefront.id],
    }),
    ordersInStorefront: one(ordersInStorefront, {
      fields: [orderEditsInStorefront.tenantId, orderEditsInStorefront.orderId],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
    }),
  })
);

export const orderTimelineInStorefrontRelations = relations(
  orderTimelineInStorefront,
  ({ one }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [
        orderTimelineInStorefront.tenantId,
        orderTimelineInStorefront.orderId,
      ],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
    }),
  })
);

export const priceListsInStorefrontRelations = relations(
  priceListsInStorefront,
  ({ one }) => ({
    marketsInStorefront: one(marketsInStorefront, {
      fields: [
        priceListsInStorefront.tenantId,
        priceListsInStorefront.marketId,
      ],
      references: [marketsInStorefront.tenantId, marketsInStorefront.id],
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
      fields: [
        productAttributesInStorefront.tenantId,
        productAttributesInStorefront.productId,
      ],
      references: [productsInStorefront.tenantId, productsInStorefront.id],
    }),
  })
);

export const productBundleItemsInStorefrontRelations = relations(
  productBundleItemsInStorefront,
  ({ one }) => ({
    productBundlesInStorefront: one(productBundlesInStorefront, {
      fields: [
        productBundleItemsInStorefront.tenantId,
        productBundleItemsInStorefront.bundleId,
      ],
      references: [
        productBundlesInStorefront.tenantId,
        productBundlesInStorefront.id,
      ],
    }),
  })
);

export const productBundlesInStorefrontRelations = relations(
  productBundlesInStorefront,
  ({ many }) => ({
    productBundleItemsInStorefronts: many(productBundleItemsInStorefront),
  })
);

export const productImagesInStorefrontRelations = relations(
  productImagesInStorefront,
  ({ one }) => ({
    productsInStorefront: one(productsInStorefront, {
      fields: [
        productImagesInStorefront.tenantId,
        productImagesInStorefront.productId,
      ],
      references: [productsInStorefront.tenantId, productsInStorefront.id],
    }),
  })
);

export const purchaseOrdersInStorefrontRelations = relations(
  purchaseOrdersInStorefront,
  ({ one, many }) => ({
    locationsInStorefront: one(locationsInStorefront, {
      fields: [
        purchaseOrdersInStorefront.tenantId,
        purchaseOrdersInStorefront.locationId,
      ],
      references: [locationsInStorefront.tenantId, locationsInStorefront.id],
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
      fields: [
        purchaseOrderItemsInStorefront.tenantId,
        purchaseOrderItemsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
  })
);

export const refundsInStorefrontRelations = relations(
  refundsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront_tenantId: one(ordersInStorefront, {
      fields: [refundsInStorefront.tenantId, refundsInStorefront.orderId],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
      relationName: 'refundsInStorefront_orderId_ordersInStorefront_id',
    }),
    ordersInStorefront_orderId: one(ordersInStorefront, {
      fields: [refundsInStorefront.tenantId, refundsInStorefront.orderId],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
      relationName: 'refundsInStorefront_orderId_ordersInStorefront_id',
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
      fields: [
        refundItemsInStorefront.tenantId,
        refundItemsInStorefront.refundId,
      ],
      references: [refundsInStorefront.tenantId, refundsInStorefront.id],
    }),
  })
);

export const rmaRequestsInStorefrontRelations = relations(
  rmaRequestsInStorefront,
  ({ one, many }) => ({
    ordersInStorefront: one(ordersInStorefront, {
      fields: [
        rmaRequestsInStorefront.tenantId,
        rmaRequestsInStorefront.orderId,
      ],
      references: [ordersInStorefront.tenantId, ordersInStorefront.id],
    }),
    orderItemsInStorefront: one(orderItemsInStorefront, {
      fields: [
        rmaRequestsInStorefront.tenantId,
        rmaRequestsInStorefront.orderItemId,
      ],
      references: [orderItemsInStorefront.tenantId, orderItemsInStorefront.id],
    }),
    rmaItemsInStorefronts: many(rmaItemsInStorefront),
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
      fields: [rmaItemsInStorefront.tenantId, rmaItemsInStorefront.rmaId],
      references: [
        rmaRequestsInStorefront.tenantId,
        rmaRequestsInStorefront.id,
      ],
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
      fields: [
        staffSessionsInStorefront.tenantId,
        staffSessionsInStorefront.staffId,
      ],
      references: [
        staffMembersInStorefront.tenantId,
        staffMembersInStorefront.id,
      ],
    }),
    tenantsInGovernance: one(tenantsInGovernance, {
      fields: [staffSessionsInStorefront.tenantId],
      references: [tenantsInGovernance.id],
    }),
  })
);

export const tenantsInGovernanceRelations = relations(
  tenantsInGovernance,
  ({ many }) => ({
    staffSessionsInStorefronts: many(staffSessionsInStorefront),
  })
);

export const taxRulesInStorefrontRelations = relations(
  taxRulesInStorefront,
  ({ one }) => ({
    taxCategoriesInStorefront: one(taxCategoriesInStorefront, {
      fields: [
        taxRulesInStorefront.tenantId,
        taxRulesInStorefront.taxCategoryId,
      ],
      references: [
        taxCategoriesInStorefront.tenantId,
        taxCategoriesInStorefront.id,
      ],
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
      fields: [
        webhookSubscriptionsInStorefront.tenantId,
        webhookSubscriptionsInStorefront.appId,
      ],
      references: [
        appInstallationsInStorefront.tenantId,
        appInstallationsInStorefront.id,
      ],
    }),
  })
);

export const appInstallationsInStorefrontRelations = relations(
  appInstallationsInStorefront,
  ({ many }) => ({
    webhookSubscriptionsInStorefronts: many(webhookSubscriptionsInStorefront),
  })
);

export const couponUsagesInStorefrontRelations = relations(
  couponUsagesInStorefront,
  ({ one }) => ({
    couponsInStorefront: one(couponsInStorefront, {
      fields: [
        couponUsagesInStorefront.tenantId,
        couponUsagesInStorefront.couponId,
      ],
      references: [couponsInStorefront.tenantId, couponsInStorefront.id],
    }),
  })
);

export const couponsInStorefrontRelations = relations(
  couponsInStorefront,
  ({ many }) => ({
    couponUsagesInStorefronts: many(couponUsagesInStorefront),
  })
);

export const inventoryTransferItemsInStorefrontRelations = relations(
  inventoryTransferItemsInStorefront,
  ({ one }) => ({
    inventoryTransfersInStorefront: one(inventoryTransfersInStorefront, {
      fields: [
        inventoryTransferItemsInStorefront.tenantId,
        inventoryTransferItemsInStorefront.transferId,
      ],
      references: [
        inventoryTransfersInStorefront.tenantId,
        inventoryTransfersInStorefront.id,
      ],
    }),
    productVariantsInStorefront: one(productVariantsInStorefront, {
      fields: [
        inventoryTransferItemsInStorefront.tenantId,
        inventoryTransferItemsInStorefront.variantId,
      ],
      references: [
        productVariantsInStorefront.tenantId,
        productVariantsInStorefront.id,
      ],
    }),
  })
);

export const shippingMethodsInStorefrontRelations = relations(
  shippingMethodsInStorefront,
  ({ one, many }) => ({
    shippingZonesInStorefront: one(shippingZonesInStorefront, {
      fields: [shippingMethodsInStorefront.zoneId],
      references: [shippingZonesInStorefront.id],
    }),
    shippingRatesInStorefronts: many(shippingRatesInStorefront),
  })
);

export const shippingZonesInStorefrontRelations = relations(
  shippingZonesInStorefront,
  ({ many }) => ({
    shippingMethodsInStorefronts: many(shippingMethodsInStorefront),
  })
);

export const shippingRatesInStorefrontRelations = relations(
  shippingRatesInStorefront,
  ({ one }) => ({
    shippingMethodsInStorefront: one(shippingMethodsInStorefront, {
      fields: [shippingRatesInStorefront.methodId],
      references: [shippingMethodsInStorefront.id],
    }),
  })
);
