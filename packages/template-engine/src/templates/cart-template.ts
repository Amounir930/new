/**
 * Cart Page Template
 * Shopping cart with items list, summary, and checkout actions
 */

import type { PageTemplate } from '../schema/template-schema'

export const cartTemplate: PageTemplate = {
    id: 'cart-default',
    name: 'Shopping Cart',
    description: 'Shopping cart page with items management, summary, and checkout flow',

    slots: [
        // Page Header
        {
            id: 'cart-header',
            componentName: 'Card',
            props: {
                className: 'border-b rounded-none',
            },
            children: [
                {
                    id: 'cart-header-content',
                    componentName: 'CardHeader',
                    props: {
                        className: 'container mx-auto',
                    },
                    children: [
                        {
                            id: 'cart-title',
                            componentName: 'CardTitle',
                            props: {
                                className: 'text-3xl',
                                children: 'سلة التسوق / Shopping Cart',
                            },
                        },
                        {
                            id: 'cart-description',
                            componentName: 'CardDescription',
                            dataBinding: 'cart.itemCount',
                        },
                    ],
                },
            ],
        },

        // Main Cart Content
        {
            id: 'cart-main-container',
            componentName: 'Card',
            props: {
                className: 'container mx-auto my-8 border-0',
            },
            children: [
                {
                    id: 'cart-grid',
                    componentName: 'Card',
                    props: {
                        className: 'grid lg:grid-cols-3 gap-8 border-0',
                    },
                    children: [
                        // Cart Items Section (2/3 width)
                        {
                            id: 'cart-items-section',
                            componentName: 'Card',
                            props: {
                                className: 'lg:col-span-2',
                            },
                            children: [
                                {
                                    id: 'items-header',
                                    componentName: 'CardHeader',
                                    children: [
                                        {
                                            id: 'items-title',
                                            componentName: 'CardTitle',
                                            props: {
                                                children: 'المنتجات / Items',
                                            },
                                        },
                                    ],
                                },
                                {
                                    id: 'items-content',
                                    componentName: 'CardContent',
                                    props: {
                                        className: 'space-y-4',
                                    },
                                    dataBinding: 'cart.items',
                                },
                                {
                                    id: 'items-footer',
                                    componentName: 'CardFooter',
                                    children: [
                                        {
                                            id: 'continue-shopping-button',
                                            componentName: 'Button',
                                            props: {
                                                variant: 'outline',
                                                children: 'متابعة التسوق / Continue Shopping',
                                            },
                                        },
                                    ],
                                },
                            ],
                        },

                        // Order Summary Section (1/3 width)
                        {
                            id: 'cart-summary-section',
                            componentName: 'Card',
                            props: {
                                className: 'lg:col-span-1 h-fit sticky top-4',
                            },
                            children: [
                                {
                                    id: 'summary-header',
                                    componentName: 'CardHeader',
                                    children: [
                                        {
                                            id: 'summary-title',
                                            componentName: 'CardTitle',
                                            props: {
                                                children: 'ملخص الطلب / Order Summary',
                                            },
                                        },
                                    ],
                                },
                                {
                                    id: 'summary-content',
                                    componentName: 'CardContent',
                                    props: {
                                        className: 'space-y-4',
                                    },
                                    children: [
                                        // Subtotal
                                        {
                                            id: 'subtotal-row',
                                            componentName: 'Card',
                                            props: {
                                                className: 'flex justify-between border-0 p-0',
                                            },
                                            children: [
                                                {
                                                    id: 'subtotal-label',
                                                    componentName: 'Label',
                                                    props: {
                                                        children: 'المجموع الفرعي / Subtotal',
                                                    },
                                                },
                                                {
                                                    id: 'subtotal-value',
                                                    componentName: 'CardDescription',
                                                    dataBinding: 'cart.subtotal',
                                                },
                                            ],
                                        },

                                        // Shipping
                                        {
                                            id: 'shipping-row',
                                            componentName: 'Card',
                                            props: {
                                                className: 'flex justify-between border-0 p-0',
                                            },
                                            children: [
                                                {
                                                    id: 'shipping-label',
                                                    componentName: 'Label',
                                                    props: {
                                                        children: 'الشحن / Shipping',
                                                    },
                                                },
                                                {
                                                    id: 'shipping-value',
                                                    componentName: 'CardDescription',
                                                    dataBinding: 'cart.shipping',
                                                },
                                            ],
                                        },

                                        // Tax
                                        {
                                            id: 'tax-row',
                                            componentName: 'Card',
                                            props: {
                                                className: 'flex justify-between border-0 p-0',
                                            },
                                            children: [
                                                {
                                                    id: 'tax-label',
                                                    componentName: 'Label',
                                                    props: {
                                                        children: 'الضريبة / Tax',
                                                    },
                                                },
                                                {
                                                    id: 'tax-value',
                                                    componentName: 'CardDescription',
                                                    dataBinding: 'cart.tax',
                                                },
                                            ],
                                        },

                                        // Total
                                        {
                                            id: 'total-row',
                                            componentName: 'Card',
                                            props: {
                                                className: 'flex justify-between border-t pt-4 border-0',
                                            },
                                            children: [
                                                {
                                                    id: 'total-label',
                                                    componentName: 'CardTitle',
                                                    props: {
                                                        className: 'text-lg',
                                                        children: 'الإجمالي / Total',
                                                    },
                                                },
                                                {
                                                    id: 'total-value',
                                                    componentName: 'CardTitle',
                                                    props: {
                                                        className: 'text-lg text-primary',
                                                    },
                                                    dataBinding: 'cart.total',
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    id: 'summary-footer',
                                    componentName: 'CardFooter',
                                    props: {
                                        className: 'flex flex-col gap-2',
                                    },
                                    children: [
                                        {
                                            id: 'checkout-button',
                                            componentName: 'Button',
                                            props: {
                                                size: 'lg',
                                                className: 'w-full',
                                                children: 'إتمام الشراء / Proceed to Checkout',
                                            },
                                        },
                                        {
                                            id: 'secure-checkout-badge',
                                            componentName: 'Badge',
                                            props: {
                                                variant: 'outline',
                                                className: 'mx-auto',
                                                children: '🔒 Secure Checkout',
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },

        // Empty Cart State (conditional)
        {
            id: 'empty-cart',
            componentName: 'Card',
            props: {
                className: 'container mx-auto my-16 max-w-md text-center',
            },
            condition: 'cart.isEmpty',
            children: [
                {
                    id: 'empty-cart-content',
                    componentName: 'CardContent',
                    props: {
                        className: 'py-12',
                    },
                    children: [
                        {
                            id: 'empty-cart-title',
                            componentName: 'CardTitle',
                            props: {
                                className: 'text-2xl mb-4',
                                children: 'سلتك فارغة / Your Cart is Empty',
                            },
                        },
                        {
                            id: 'empty-cart-description',
                            componentName: 'CardDescription',
                            props: {
                                className: 'mb-6',
                                children: 'Add some products to get started',
                            },
                        },
                        {
                            id: 'shop-now-button',
                            componentName: 'Button',
                            props: {
                                size: 'lg',
                                children: 'تسوق الآن / Shop Now',
                            },
                        },
                    ],
                },
            ],
        },

        // Recommended Products
        {
            id: 'recommended-products',
            componentName: 'Card',
            props: {
                className: 'container mx-auto my-8 border-0',
            },
            children: [
                {
                    id: 'recommended-header',
                    componentName: 'CardHeader',
                    children: [
                        {
                            id: 'recommended-title',
                            componentName: 'CardTitle',
                            props: {
                                className: 'text-2xl',
                                children: 'قد يعجبك أيضاً / You May Also Like',
                            },
                        },
                    ],
                },
                {
                    id: 'recommended-grid',
                    componentName: 'BentoGrid',
                    dataBinding: 'recommendedProducts',
                },
            ],
        },
    ],

    metadata: {
        category: 'cart',
        rtlSupport: true,
        locales: ['en', 'ar'],
        tags: ['cart', 'checkout', 'e-commerce'],
        version: '1.0.0',
    },
}
