/**
 * MSW Handlers for Products API
 *
 * Mock API endpoints for product testing.
 *
 * @module @apex/test-utils/mocks/handlers/products
 */

import { HttpResponse, http } from 'msw';
import { createMockProduct, createMockProductList } from '../../fixtures';

const BASE_URL = '/api';

export const productsHandlers = [
  // GET /api/products - List products
  http.get(`${BASE_URL}/products`, () => {
    const products = createMockProductList(12);

    return HttpResponse.json({
      products,
      total: products.length,
      page: 1,
      pageSize: 12,
    });
  }),

  // GET /api/products/:id - Get single product
  http.get(`${BASE_URL}/products/:id`, ({ params }) => {
    const { id } = params;
    const isString = (s: unknown): s is string => typeof s === 'string';
    const product = createMockProduct({
      id: typeof id === 'string' ? id : String(id),
    });

    return HttpResponse.json({ product });
  }),

  // GET /api/products/slug/:slug - Get product by slug
  http.get(`${BASE_URL}/products/slug/:slug`, ({ params }) => {
    const { slug } = params;
    const isString = (s: unknown): s is string => typeof s === 'string';
    const product = createMockProduct({
      slug: isString(slug) ? slug : String(slug),
    });

    return HttpResponse.json({ product });
  }),

  // GET /api/products/category/:categoryId - Get products by category
  http.get(`${BASE_URL}/products/category/:categoryId`, ({ params }) => {
    const { categoryId } = params;
    const isString = (s: unknown): s is string => typeof s === 'string';
    const products = createMockProductList(8).map((p) => ({
      ...p,
      categoryId: isString(categoryId) ? categoryId : String(categoryId),
    }));

    return HttpResponse.json({ products });
  }),
];
