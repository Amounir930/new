import { drizzle, pages, publicPool, settings } from '@apex/db';
import type { BlueprintTemplate } from './blueprint/types';
import { sanitizeSchemaName } from './schema-manager';

export class SnapshotManager {
  /**
   * Create a blueprint snapshot from a live tenant (Privacy-Focused)
   * @param subdomain - Tenant subdomain to snapshot
   * @param nicheType - Optional industry niche classification
   */
  async createSnapshot(
    subdomain: string,
    _nicheType?: string
  ): Promise<BlueprintTemplate> {
    const schemaName = sanitizeSchemaName(subdomain);
    const client = await publicPool.connect();

    try {
      // 🔒 S2 Protocol: Strict Usage of Search Path
      await client.query(`SET search_path TO "${schemaName}"`);
      const db = drizzle(client);

      // 1. Settings (Anonymized: Exclude emails and phones)
      const settingsData = await db.select().from(settings);
      const settingsMap: Record<string, string> = {};
      for (const s of settingsData) {
        if (!s.key.includes('email') && !s.key.includes('phone')) {
          settingsMap[s.key] = s.value;
        }
      }

      // 2. Pages (Structure-Only: Headers only, empty content)
      const pagesData = await db.select().from(pages);
      const pagesMapped = pagesData.map((p) => ({
        slug: p.slug,
        title: p.title,
        content: '', // Anonymized: Protect client content
        isPublished: p.isPublished || false,
      }));

      // 3. Categories & Products (Empty: Protect Intellectual Property)
      // We return empty arrays to ensure the blueprint is a reusable structure, not a copy of business data.
      const categoriesMapped: unknown[] = [];
      const productsMapped: unknown[] = [];

      // 4. Construct Template
      return {
        name: `Structure-Only Snapshot of ${subdomain}`,
        version: '1.0',
        description: `Generic blueprint generated on ${new Date().toISOString()}`,
        modules: {
          core: {
            siteName: subdomain, // Default site name
          },
        },
        settings: settingsMap,
        pages: pagesMapped,
        categories: categoriesMapped,
        products: productsMapped,
      };
    } catch (error) {
      console.error(
        `[SnapshotManager] Failed to snapshot ${subdomain}:`,
        error
      );
      throw error;
    } finally {
      client.release();
    }
  }
}
