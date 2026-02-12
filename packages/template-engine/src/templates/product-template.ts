/**
 * Product Page Template
 * Product detail page with image gallery, details, and purchase actions
 */

import type { PageTemplate } from '../schema/template-schema';

export const productTemplate: PageTemplate = {
  id: 'product-default',
  name: 'Product Detail Page',
  description:
    'Complete product page with gallery, specifications, reviews, and purchase options',

  slots: [
    // Page Container
    {
      id: 'product-container',
      componentName: 'Card',
      props: {
        className: 'container mx-auto my-8',
      },
      children: [
        {
          id: 'product-content',
          componentName: 'CardContent',
          props: {
            className: 'p-6',
          },
          children: [
            // Product Header (Title, Badge)
            {
              id: 'product-header',
              componentName: 'CardHeader',
              props: {
                className: 'px-0',
              },
              children: [
                {
                  id: 'product-badge',
                  componentName: 'Badge',
                  props: {
                    variant: 'default',
                    className: 'mb-2',
                    children: 'New Arrival',
                  },
                  dataBinding: 'product.badge',
                },
                {
                  id: 'product-title',
                  componentName: 'CardTitle',
                  props: {
                    className: 'text-3xl mb-2',
                  },
                  dataBinding: 'product.name',
                },
                {
                  id: 'product-description',
                  componentName: 'CardDescription',
                  props: {
                    className: 'text-lg',
                  },
                  dataBinding: 'product.shortDescription',
                },
              ],
            },

            // Product Grid (Image + Details)
            {
              id: 'product-grid',
              componentName: 'Card',
              props: {
                className: 'grid md:grid-cols-2 gap-8 border-0',
              },
              children: [
                // Image Section
                {
                  id: 'product-images',
                  componentName: 'Card',
                  props: {
                    className: 'border-0',
                  },
                  dataBinding: 'product.images',
                },

                // Details Section
                {
                  id: 'product-details-section',
                  componentName: 'Card',
                  props: {
                    className: 'space-y-6',
                  },
                  children: [
                    {
                      id: 'product-price-card',
                      componentName: 'CardContent',
                      props: {
                        className: 'space-y-2',
                      },
                      children: [
                        {
                          id: 'product-price-label',
                          componentName: 'Label',
                          props: {
                            children: 'السعر / Price',
                          },
                        },
                        {
                          id: 'product-price',
                          componentName: 'CardTitle',
                          props: {
                            className: 'text-2xl text-primary',
                          },
                          dataBinding: 'product.price',
                        },
                      ],
                    },

                    // Specifications
                    {
                      id: 'product-specs',
                      componentName: 'Card',
                      children: [
                        {
                          id: 'specs-header',
                          componentName: 'CardHeader',
                          children: [
                            {
                              id: 'specs-title',
                              componentName: 'CardTitle',
                              props: {
                                className: 'text-lg',
                                children: 'المواصفات / Specifications',
                              },
                            },
                          ],
                        },
                        {
                          id: 'specs-content',
                          componentName: 'CardContent',
                          dataBinding: 'product.specifications',
                        },
                      ],
                    },

                    // Action Buttons
                    {
                      id: 'product-actions',
                      componentName: 'CardFooter',
                      props: {
                        className: 'flex gap-4 px-0',
                      },
                      children: [
                        {
                          id: 'add-to-cart-button',
                          componentName: 'Button',
                          props: {
                            size: 'lg',
                            className: 'flex-1',
                            children: 'أضف للسلة / Add to Cart',
                          },
                        },
                        {
                          id: 'buy-now-button',
                          componentName: 'Button',
                          props: {
                            variant: 'outline',
                            size: 'lg',
                            className: 'flex-1',
                            children: 'اشترِ الآن / Buy Now',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },

            // Product Description
            {
              id: 'product-full-description',
              componentName: 'Card',
              props: {
                className: 'mt-8',
              },
              children: [
                {
                  id: 'description-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'description-title',
                      componentName: 'CardTitle',
                      props: {
                        children: 'الوصف / Description',
                      },
                    },
                  ],
                },
                {
                  id: 'description-content',
                  componentName: 'CardContent',
                  dataBinding: 'product.fullDescription',
                },
              ],
            },

            // Reviews Section
            {
              id: 'reviews-section',
              componentName: 'Card',
              props: {
                className: 'mt-8',
              },
              condition: 'product.reviews',
              children: [
                {
                  id: 'reviews-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'reviews-title',
                      componentName: 'CardTitle',
                      props: {
                        children: 'التقييمات / Customer Reviews',
                      },
                    },
                  ],
                },
                {
                  id: 'reviews-marquee',
                  componentName: 'Marquee',
                  props: {
                    pauseOnHover: true,
                    className: 'py-4',
                  },
                  dataBinding: 'product.reviews',
                },
              ],
            },
          ],
        },
      ],
    },

    // Related Products
    {
      id: 'related-products',
      componentName: 'Card',
      props: {
        className: 'container mx-auto my-8 border-0',
      },
      condition: 'relatedProducts',
      children: [
        {
          id: 'related-header',
          componentName: 'CardHeader',
          children: [
            {
              id: 'related-title',
              componentName: 'CardTitle',
              props: {
                className: 'text-2xl',
                children: 'منتجات ذات صلة / Related Products',
              },
            },
          ],
        },
        {
          id: 'related-grid',
          componentName: 'BentoGrid',
          dataBinding: 'relatedProducts',
        },
      ],
    },
  ],

  metadata: {
    category: 'product',
    rtlSupport: true,
    locales: ['en', 'ar'],
    tags: ['product', 'e-commerce', 'detail'],
    version: '1.0.0',
  },
};
