/**
 * Configuration for Store App
 * Isolates process.env for S1 compliance
 */

export const config = {
  internalApiUrl: process.env['INTERNAL_API_URL'] || 'http://api:3000/api/v1',
  publicApiUrl:
    process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api/v1',
  nodeEnv: process.env['NODE_ENV'] || 'development',
};
