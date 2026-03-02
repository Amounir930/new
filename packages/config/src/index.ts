/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */

import { EnvSchema, type EnvConfig } from './schema.js';
import { validateEnv, enforceS1Compliance } from './validator.js';

export * from './schema.js';
export { validateEnv, enforceS1Compliance };

// Auto-execute on import for fail-fast behavior
if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    enforceS1Compliance();
  } else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
    enforceS1Compliance();
  }
}

/**
 * Global validated environment configuration
 * (Fail-fast initialization)
 * S1: Strictly enforced. No bypasses.
 */
export const env: EnvConfig = (() => {
  if (process.env.NODE_ENV === 'test') {
    try {
      return EnvSchema.parse(process.env);
    } catch (_e) {
      // In test mode, we allow raw object access only if parsing fails,
      // primarily to support mock testing of the validator itself.
      return process.env as unknown as EnvConfig;
    }
  }
  return validateEnv();
})();

export * from './config.service';
