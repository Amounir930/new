import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const storefrontDir = join(import.meta.dir, '../src/schema/storefront');
const files = readdirSync(storefrontDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts'
);

for (const file of files) {
  const filePath = join(storefrontDir, file);
  let content = readFileSync(filePath, 'utf-8');

  // Convert pgTable( to storefrontSchema.table(
  if (content.includes('pgTable(')) {
    content = content.replace(/pgTable\(/g, 'storefrontSchema.table(');

    // Ensure storefrontSchema is imported from ../v5-core
    if (content.includes('../v5-core')) {
      if (!content.includes('storefrontSchema')) {
        content = content.replace(
          /from '\.\.\/v5-core';/,
          ", storefrontSchema } from '../v5-core';"
        );
        content = content.replace(
          /}\s*,\s*storefrontSchema/,
          ', storefrontSchema }'
        );
      }
    } else {
      content = `import { storefrontSchema } from '../v5-core';\n${content}`;
    }

    writeFileSync(filePath, content, 'utf-8');
    process.stdout.write(`Updated ${file}`);
  }
}
