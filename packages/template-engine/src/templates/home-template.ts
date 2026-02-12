/**
 * Home Page Template
 * Default home page with hero, features, testimonials, and CTA
 */

import type { PageTemplate } from '../schema/template-schema';

export const homeTemplate: PageTemplate = {
  id: 'home-default',
  name: 'Default Home Page',
  description:
    'Modern home page with hero section, feature showcase, testimonials, and call-to-action',

  slots: [
    // Hero Section
    {
      id: 'hero-section',
      componentName: 'Card',
      props: {
        className:
          'border-0 rounded-none bg-gradient-to-br from-primary/5 to-primary/10',
      },
      children: [
        {
          id: 'hero-content',
          componentName: 'CardContent',
          props: {
            className: 'container mx-auto px-4 py-20 text-center',
          },
          children: [
            {
              id: 'hero-title',
              componentName: 'CardTitle',
              props: {
                className: 'text-5xl font-bold mb-6',
                children: 'Welcome to Our Store',
              },
            },
            {
              id: 'hero-description',
              componentName: 'CardDescription',
              props: {
                className: 'text-xl mb-8 max-w-2xl mx-auto',
                children:
                  'Discover amazing products at unbeatable prices. Shop with confidence.',
              },
            },
            {
              id: 'hero-cta',
              componentName: 'Button',
              props: {
                size: 'lg',
                children: 'Shop Now',
              },
            },
          ],
        },
      ],
    },

    // Features Section (Bento Grid)
    {
      id: 'features-section',
      componentName: 'Card',
      props: {
        className: 'container mx-auto px-4 py-16',
      },
      // Note: BentoCard children would be populated with actual feature data
    },

    // Testimonials (Marquee)
    {
      id: 'testimonials-section',
      componentName: 'Card',
      props: {
        className: 'border-0 rounded-none bg-muted/50',
      },
      children: [
        {
          id: 'testimonials-header',
          componentName: 'CardHeader',
          props: {
            className: 'text-center',
          },
          children: [
            {
              id: 'testimonials-title',
              componentName: 'CardTitle',
              props: {
                className: 'text-3xl',
                children: 'What Our Customers Say',
              },
            },
          ],
        },
        {
          id: 'testimonials-marquee',
          componentName: 'Marquee',
          props: {
            pauseOnHover: true,
            className: 'py-8',
          },
          dataBinding: 'testimonials',
        },
      ],
    },

    // Final CTA
    {
      id: 'cta-section',
      componentName: 'Card',
      props: {
        className: 'border-0 rounded-none',
      },
      children: [
        {
          id: 'cta-content',
          componentName: 'CardContent',
          props: {
            className: 'container mx-auto px-4 py-16 text-center',
          },
          children: [
            {
              id: 'cta-title',
              componentName: 'CardTitle',
              props: {
                className: 'text-4xl mb-4',
                children: 'Ready to Get Started?',
              },
            },
            {
              id: 'cta-description',
              componentName: 'CardDescription',
              props: {
                className: 'text-lg mb-6',
                children: 'Join thousands of satisfied customers today',
              },
            },
            {
              id: 'cta-button',
              componentName: 'Button',
              props: {
                size: 'lg',
                variant: 'default',
                children: 'Start Shopping',
              },
            },
          ],
        },
      ],
    },
  ],

  metadata: {
    category: 'home',
    rtlSupport: true,
    locales: ['en', 'ar'],
    tags: ['default', 'modern', 'e-commerce'],
    version: '1.0.0',
  },
};
