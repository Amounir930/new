/**
 * Checkout Page Template
 * Complete checkout flow with payment, address, and phone inputs
 */

import type { PageTemplate } from '../schema/template-schema';

export const checkoutTemplate: PageTemplate = {
  id: 'checkout-default',
  name: 'Checkout Page',
  description:
    'Complete checkout flow with payment processing, shipping address, and contact information',

  slots: [
    // Page Header
    {
      id: 'checkout-header',
      componentName: 'Card',
      props: {
        className: 'border-b rounded-none',
      },
      children: [
        {
          id: 'checkout-header-content',
          componentName: 'CardHeader',
          props: {
            className: 'container mx-auto',
          },
          children: [
            {
              id: 'checkout-title',
              componentName: 'CardTitle',
              props: {
                className: 'text-3xl',
                children: 'الدفع / Checkout',
              },
            },
            {
              id: 'checkout-description',
              componentName: 'CardDescription',
              props: {
                children: 'Complete your purchase securely',
              },
            },
          ],
        },
      ],
    },

    // Main Checkout Form
    {
      id: 'checkout-main',
      componentName: 'Card',
      props: {
        className: 'container mx-auto my-8 max-w-3xl',
      },
      children: [
        {
          id: 'checkout-content',
          componentName: 'CardContent',
          props: {
            className: 'space-y-8 p-6',
          },
          children: [
            // Contact Information Section
            {
              id: 'contact-section',
              componentName: 'Card',
              children: [
                {
                  id: 'contact-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'contact-title',
                      componentName: 'CardTitle',
                      props: {
                        className: 'text-lg',
                        children: 'معلومات الاتصال / Contact Information',
                      },
                    },
                  ],
                },
                {
                  id: 'contact-content',
                  componentName: 'CardContent',
                  props: {
                    className: 'space-y-4',
                  },
                  children: [
                    {
                      id: 'contact-name',
                      componentName: 'Label',
                      props: {
                        htmlFor: 'name',
                        children: 'الاسم / Full Name',
                      },
                    },
                    {
                      id: 'contact-name-input',
                      componentName: 'Input',
                      props: {
                        id: 'name',
                        type: 'text',
                        placeholder: 'John Doe / أحمد محمد',
                      },
                    },
                    {
                      id: 'contact-phone',
                      componentName: 'PhoneInput',
                      props: {
                        initialCountryCode: '+20',
                      },
                      dataBinding: 'user.phone',
                    },
                  ],
                },
              ],
            },

            // Shipping Address Section
            {
              id: 'address-section',
              componentName: 'Card',
              children: [
                {
                  id: 'address-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'address-title',
                      componentName: 'CardTitle',
                      props: {
                        className: 'text-lg',
                        children: 'عنوان الشحن / Shipping Address',
                      },
                    },
                  ],
                },
                {
                  id: 'address-content',
                  componentName: 'CardContent',
                  children: [
                    {
                      id: 'address-form',
                      componentName: 'AddressForm',
                      dataBinding: 'user.address',
                    },
                  ],
                },
              ],
            },

            // Payment Section
            {
              id: 'payment-section',
              componentName: 'Card',
              children: [
                {
                  id: 'payment-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'payment-title',
                      componentName: 'CardTitle',
                      props: {
                        className: 'text-lg',
                        children: 'معلومات الدفع / Payment Information',
                      },
                    },
                    {
                      id: 'payment-description',
                      componentName: 'CardDescription',
                      props: {
                        children:
                          'Your payment information is secure and encrypted',
                      },
                    },
                  ],
                },
                {
                  id: 'payment-content',
                  componentName: 'CardContent',
                  children: [
                    {
                      id: 'payment-input',
                      componentName: 'PaymentInput',
                      dataBinding: 'payment',
                    },
                  ],
                },
              ],
            },

            // Order Summary (conditional)
            {
              id: 'summary-section',
              componentName: 'Card',
              props: {
                className: 'bg-muted',
              },
              condition: 'cart.items',
              children: [
                {
                  id: 'summary-header',
                  componentName: 'CardHeader',
                  children: [
                    {
                      id: 'summary-title',
                      componentName: 'CardTitle',
                      props: {
                        className: 'text-lg',
                        children: 'ملخص الطلب / Order Summary',
                      },
                    },
                  ],
                },
                {
                  id: 'summary-content',
                  componentName: 'CardContent',
                  dataBinding: 'cart',
                },
              ],
            },
          ],
        },

        // Footer with Submit Button
        {
          id: 'checkout-footer',
          componentName: 'CardFooter',
          props: {
            className: 'flex justify-between',
          },
          children: [
            {
              id: 'back-button',
              componentName: 'Button',
              props: {
                variant: 'outline',
                children: 'العودة / Back to Cart',
              },
            },
            {
              id: 'submit-button',
              componentName: 'Button',
              props: {
                size: 'lg',
                children: 'إتمام الشراء / Complete Purchase',
              },
            },
          ],
        },
      ],
    },
  ],

  metadata: {
    category: 'checkout',
    rtlSupport: true,
    locales: ['en', 'ar'],
    tags: ['checkout', 'payment', 'forms'],
    version: '1.0.0',
  },
};
