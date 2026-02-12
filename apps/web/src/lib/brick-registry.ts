import dynamic from 'next/dynamic';

/**
 * 🗺️ V3 Brick component registry
 * Maps LEGO brick types to their React implementations.
 */
export const brickRegistry: Record<string, any> = {
  PageContainer: dynamic(() => import('@/components/layout/PageContainerV3')),
  Section: dynamic(() => import('@/components/layout/SectionV3')),
  Container: dynamic(() => import('@/components/layout/ContainerV3')),
  Hero: dynamic(() => import('@/components/home/HeroV3')),
  ProductGrid: dynamic(() => import('@/components/products/ProductGridV3')),
};
