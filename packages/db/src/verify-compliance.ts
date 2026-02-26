import { resolve } from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

import { publicPool } from './connection.js';

async function verifyCompliance() {
  try {
    console.log('Running forensic RLS compliance check...');
    const res = await publicPool.query(
      'SELECT governance.verify_compliance() as result'
    );
    const result = res.rows[0].result;
    if (result !== '100% COMPLIANCE VERIFIED') {
      console.error(`Audit Failure: ${result}`);
      process.exit(1);
    }
    console.log('S2/S5 Verification: ALL COMPLIANCE CHECKS PASSED.');
    process.exit(0);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('❌ Compliance Drift Detected:', error.message);
    process.exit(1);
  } finally {
    await publicPool.end();
  }
}

verifyCompliance();
