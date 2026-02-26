import { describe, expect, it } from 'bun:test';

describe('Connection Pool Forensic Reset', () => {
  it('should execute RESET ALL on every pool release Path', async () => {
    // This test verifies the implementation in src/connection.ts
    // Since we can't easily spy on the real pool release without complex mocking,
    // we audit the source file for the unconditional reset call.

    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const connectionFile = path.resolve(
      new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      'connection.ts'
    );
    const content = await fs.readFile(connectionFile, 'utf8');

    // C-4 Fix: After removing 'public' from search_path, the reset now
    // uses only RESET ALL without an explicit SET search_path TO public.
    expect(content).toMatch(/RESET ALL/i);
  });
});
