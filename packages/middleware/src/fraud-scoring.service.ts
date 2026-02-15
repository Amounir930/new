/**
 * S14: Fraud Detection - Real-time Fraud Scoring
 * Constitution Reference: architecture.md (S14 Protocol)
 * Purpose: Calculate a risk score for each request
 */

import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { GeoIpService } from './geo-ip.service.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
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

    // 2. Geo-IP Inconsistency (L2) - Impossible Travel Detection
    const currentGeo = await this.geoIp.getGeoData(ip);
    if (currentGeo && fingerprint) {
      const client = await this.store.getClient();

      // Only proceed if Redis is available (Fail-Open for this specific check)
      if (client) {
        const geoKey = `fraud:geo:${fingerprint}`;
        const lastGeoRaw = await client.get(geoKey);

        if (lastGeoRaw) {
          try {
            const lastGeo = JSON.parse(lastGeoRaw);
            // S14 Rule: Country change detected
            if (lastGeo.country !== currentGeo.country) {
              const timeDiff = Date.now() - lastGeo.timestamp;
              // If travel happened in less than 12 hours (Impossible Travel)
              // This is a strict rule: users shouldn't teleport between countries
              if (timeDiff < 12 * 60 * 60 * 1000) {
                score += 50;
                reasons.push(`Impossible Travel detected: ${lastGeo.country} -> ${currentGeo.country}`);
              }
            }
          } catch (e) {
            // Ignore parsing errors, cleaner overwrite
          }
        }

        // Update last known location (24h TTL)
        await client.setEx(geoKey, 86400, JSON.stringify({
          country: currentGeo.country,
          city: currentGeo.city,
          timestamp: Date.now()
        }));
      }
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
