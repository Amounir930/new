import { validateBlueprint } from '../schema/v3';

/**
 * 🏠 V3 Home Page Blueprint
 * Hierarchical, clean, and data-bound.
 */
export const v3HomeTemplate = validateBlueprint({
    version: '3.0.0',
    id: 'standard-home',
    name: 'StyleGrove Home',
    slug: '/',
    category: 'home',
    layout: { theme: 'premium', isFullWidth: true, rtl: true },
    root: {
        id: 'root-layout',
        type: 'PageContainer',
        slots: {
            content: [
                {
                    id: 'hero-section',
                    type: 'Section',
                    props: { padding: 'none' },
                    slots: {
                        children: [
                            {
                                id: 'main-hero',
                                type: 'Hero',
                                props: {
                                    headline: '{{ store.name }}',
                                    subheadline: 'Elite Shopping Experience',
                                    ctaText: 'Shop Now',
                                }
                            }
                        ]
                    }
                },
                {
                    id: 'deals-section',
                    type: 'Section',
                    props: { padding: 'medium' },
                    slots: {
                        children: [
                            {
                                id: 'deals-container',
                                type: 'Container',
                                props: { maxWidth: 'lg' },
                                slots: {
                                    children: [
                                        {
                                            id: 'flash-deals',
                                            type: 'ProductGrid',
                                            data: { condition: 'flash_deals.active' },
                                            props: {
                                                title: 'Flash Deals',
                                                algorithm: 'on_sale',
                                                limit: 4
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    id: 'latest-section',
                    type: 'Section',
                    slots: {
                        children: [
                            {
                                id: 'latest-grid',
                                type: 'ProductGrid',
                                props: {
                                    title: 'New Arrivals',
                                    algorithm: 'latest',
                                    limit: 8
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
});
