/**
 * Apex DB Bootstrap
 * Handles global side-effects and environment normalization.
 */

/**
 * Fatal Mandate #19/32: Global JSON.stringify Monkey-patch
 * Nuclear backstop to prevent TypeError in production microservices.
 * Moved from schema core to prevent multiple executions and side-effects.
 */
const originalStringify = JSON.stringify;

type JSONReplacer = (key: string, value: unknown) => unknown;

JSON.stringify = (
  value: unknown,
  replacer?: JSONReplacer | (string | number)[] | null,
  space?: string | number
): string => {
  const bigintReplacerOverride: JSONReplacer = (key: string, val: unknown) => {
    const finalVal = typeof val === 'bigint' ? val.toString() : val;

    if (typeof replacer === 'function') {
      return replacer(key, finalVal);
    }
    return finalVal;
  };

  return originalStringify(
    value,
    bigintReplacerOverride as (key: string, value: any) => any,
    space
  );
};

console.log('[Apex/DB] Global BigInt.toJSON patch applied.');
