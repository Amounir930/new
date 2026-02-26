import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const storefrontDir = join(import.meta.dir, '../src/schema/storefront');
const files = readdirSync(storefrontDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts'
);

for (const file of files) {
  const filePath = join(storefrontDir, file);
  let content = readFileSync(filePath, 'utf-8');

  // Fix ", storefrontSchema }" syntax
  if (content.includes(', storefrontSchema } from')) {
    content = content.replace(
      /\s*,\s*storefrontSchema\s*}\s*from/g,
      '\n  storefrontSchema,\n} from'
    );
    content = content.replace(
      /,(\s*\n\s*)storefrontSchema/g,
      '$1storefrontSchema'
    ); // Remove double commas
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Repaired syntax in ${file}`);
  }
}
