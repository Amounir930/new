/**
 * Client-side Configuration for Admin App
 * Isolates process.env for S1 compliance
 */

export const config = {
  apiUrl: process.env['NEXT_PUBLIC_API_URL'] || 'https://api.60sec.shop/api/v1',
  nodeEnv: process.env['NODE_ENV'] || 'development',
};
