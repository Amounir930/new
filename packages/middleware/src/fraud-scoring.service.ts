/**
 * S14: Fraud Detection - Real-time Fraud Scoring
 * Constitution Reference: architecture.md (S14 Protocol)
 * Purpose: Calculate a risk score for each request
 */

import { Injectable } from '@nestjs/common';
import { GeoIpService } from './geo-ip.service.js';
import { RedisRateLimitStore } from './redis-rate-limit-store.js';

export interface FraudScore {
  score: number; // 0-100 (100 is high risk)
  reasons: string[];
}

@Injectable()
export class FraudScoringService {
  constructor(
    private readonly store: RedisRateLimitStore,
    private readonly geoIp: GeoIpService
  ) { }

  async calculateScore(req: any): Promise<FraudScore> {
    let score = 0;
    const reasons: string[] = [];

    const fingerprint = req.fingerprint;
    const ip = req.fingerprintData?.ip;

    // 1. Check Velocity per Fingerprint (L3)
    if (fingerprint) {
      const key = `fraud:velocity:${fingerprint}`;
      const { count } = await this.store.increment(key, 60000); // 1-minute window

      if (count > 50) {
        score += 30;
        reasons.push('High velocity per fingerprint');
      }
    }

    // 2. Geo-IP Inconsistency (L2)
    const currentGeo = await this.geoIp.getGeoData(ip);
    if (currentGeo) {
      // Check last known Geo in Redis
      // In a real impl, we'd fetch this from Redis
      // For now, we skip the persistent check as it requires more Redis logic
    }

    // 3. Known Bot Patterns (L1 - S11 overlap)
    if (
      !req.headers['user-agent'] ||
      req.headers['user-agent'].includes('Headless')
    ) {
      score += 40;
      reasons.push('Anomalous User-Agent');
    }

    return {
      score: Math.min(score, 100),
      reasons,
    };
  }
}
