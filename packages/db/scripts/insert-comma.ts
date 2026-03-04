import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const storefrontDir = join(import.meta.dir, '../src/schema/storefront');
const files = readdirSync(storefrontDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts'
);

for (const file of files) {
  const filePath = join(storefrontDir, file);
  let content = readFileSync(filePath, 'utf-8');

  // Fix missing comma before storefrontSchema
  if (content.includes('storefrontSchema,')) {
    // Look for a word character, followed by optional spaces, a newline, and storefrontSchema,
    content = content.replace(
      /([a-zA-Z0-9_])\s*\n\s*storefrontSchema,/g,
      '$1,\n  storefrontSchema,'
    );
    writeFileSync(filePath, content, 'utf-8');
    process.stdout.write(`Inserted missing comma in ${file}`);
  }
}
