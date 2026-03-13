/**
 * Client-side Configuration for Admin App
 * Isolates process.env for S1 compliance
 */

export const config = {
  apiUrl: (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api/v1').replace(/\/$/, ''),
  nodeEnv: process.env['NODE_ENV'] || 'development',
};
