export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { startTracing } = await import('@apex/monitoring');
    startTracing('apex-storefront');
  }
}
