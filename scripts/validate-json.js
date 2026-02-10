import { readFileSync } from 'fs';

/**
 * Surgical JSON Validator (S1-S8 Elite Grade) - v3 (String-Aware)
 * Strips comments without breaking URLs or wildcards in strings.
 */
function validateJson(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');

    // 1. String-Aware Comment Stripping
    // Matches strings first to "consume" them, then matches comments to remove them.
    const sanitized = raw
      .replace(
        /("(?:[^"\\]|\\.)*")|(?:\/\*[\s\S]*?\*\/|\/\/[^\n\r]*)/g,
        (_match, string) => {
          if (string) return string; // Return the string as-is
          return ''; // Return empty for comments
        }
      )
      // 2. Strip illegal control characters (U+0000 to U+001F) except standard whitespace
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

    // 3. Strict JSON structural check
    JSON.parse(sanitized);
    return true;
  } catch (error) {
    const raw = readFileSync(filePath, 'utf8');
    console.error(`🚨 CRITICAL: Invalid JSON in ${filePath}`);
    console.error(`Reason: ${error.message}`);

    const posMatch = error.message.match(/at position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const start = Math.max(0, pos - 40);
      const end = Math.min(raw.length, pos + 40);
      const context = raw.substring(start, end);
      console.error(
        `Context around error (pos ${pos}):\n...${context.replace(
          /\n/g,
          '\\n'
        )}...`
      );

      // Also show the "sanitized" version for debugging
      const sanitizedDebug = raw.replace(
        /("(?:[^"\\]|\\.)*")|(?:\/\*[\s\S]*?\*\/|\/\/[^\n\r]*)/g,
        (_m, s) => s || ''
      );
      const sContext = sanitizedDebug.substring(
        Math.max(0, pos - 20),
        Math.min(sanitizedDebug.length, pos + 20)
      );
      console.error(
        `Sanitized context: "...${sContext.replace(/\n/g, '\\n')}..."`
      );
    }
    return false;
  }
}

const files = process.argv.slice(2);
let hasError = false;

for (const file of files) {
  if (!validateJson(file)) {
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ All JSON files passed elite validation');
}
