import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const storefrontDir = join(import.meta.dir, '../src/schema/storefront');
const files = readdirSync(storefrontDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts'
);

for (const file of files) {
  const filePath = join(storefrontDir, file);
  let content = readFileSync(filePath, 'utf-8');

  // If it needs the schema but doesn't have it imported
  if (
    content.includes('storefrontSchema.table') &&
    !content.includes('storefrontSchema }') &&
    !content.includes('storefrontSchema,')
  ) {
    if (content.includes('../v5-core')) {
      content = content.replace(
        /}\s*from\s*'\.\.\/v5-core';/,
        ", storefrontSchema } from '../v5-core';"
      );
    } else {
      content = `import { storefrontSchema } from '../v5-core';\n${content}`;
    }
    writeFileSync(filePath, content, 'utf-8');
    process.stdout.write(`Fixed import in ${file}`);
  }
}
