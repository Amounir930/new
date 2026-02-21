/**
 * MSW Handlers for Products API
 *
 * Mock API endpoints for product testing.
 *
 * @module @apex/test-utils/mocks/handlers/products
 */

import { http, HttpResponse } from 'msw';
import {
  createMockProduct,
  createMockProductList,
} from '../../fixtures/product.fixtures';

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
    const product = createMockProduct({ id: id as string });

    return HttpResponse.json({ product });
  }),

  // GET /api/products/slug/:slug - Get product by slug
  http.get(`${BASE_URL}/products/slug/:slug`, ({ params }) => {
    const { slug } = params;
    const product = createMockProduct({ slug: slug as string });

    return HttpResponse.json({ product });
  }),

  // GET /api/products/category/:categoryId - Get products by category
  http.get(`${BASE_URL}/products/category/:categoryId`, ({ params }) => {
    const { categoryId } = params;
    const products = createMockProductList(8).map((p) => ({
      ...p,
      categoryId: categoryId as string,
    }));

    return HttpResponse.json({ products });
  }),
];
