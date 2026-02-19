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

interface GeoLocation {
  country: string;
  city: string;
  timestamp: number;
}

interface FraudCheckResult {
  score: number;
  reason?: string;
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
    const velocityResult = await this.checkVelocity(fingerprint);
    score += velocityResult.score;
    if (velocityResult.reason) reasons.push(velocityResult.reason);

    // 2. Geo-IP Inconsistency (L2) - Impossible Travel Detection
    const geoResult = await this.checkGeoConsistency(ip, fingerprint);
    score += geoResult.score;
    if (geoResult.reason) reasons.push(geoResult.reason);

    // 3. Known Bot Patterns (L1 - S11 overlap)
    const botResult = this.checkBotPatterns(req);
    score += botResult.score;
    if (botResult.reason) reasons.push(botResult.reason);

    // 4. Payment Specific Velocity (S14)
    const paymentVelocity = await this.checkPaymentVelocity(fingerprint);
    score += paymentVelocity.score;
    if (paymentVelocity.reason) reasons.push(paymentVelocity.reason);

    return {
      score: Math.min(score, 100),
      reasons,
    };
  }

  private async checkPaymentVelocity(
    fingerprint: string | undefined
  ): Promise<FraudCheckResult> {
    if (!fingerprint) return { score: 0 };

    const key = `fraud:payment:velocity:${fingerprint}`;
    // Limit to 3 attempts per hour for payments (S14 Strict)
    const { count } = await this.store.increment(key, 3600000);

    if (count > 3) {
      return { score: 60, reason: 'Excessive payment attempts detected' };
    }

    return { score: 0 };
  }

  private async checkVelocity(
    fingerprint: string | undefined
  ): Promise<FraudCheckResult> {
    if (!fingerprint) return { score: 0 };

    const key = `fraud:velocity:${fingerprint}`;
    const { count } = await this.store.increment(key, 60000); // 1-minute window

    if (count > 50) {
      return { score: 30, reason: 'High velocity per fingerprint' };
    }

    return { score: 0 };
  }

  private async checkGeoConsistency(
    ip: string | undefined,
    fingerprint: string | undefined
  ): Promise<FraudCheckResult> {
    if (!ip || !fingerprint) return { score: 0 };

    const currentGeo = await this.geoIp.getGeoData(ip);
    if (!currentGeo) return { score: 0 };

    const client = await this.store.getClient();
    if (!client) return { score: 0 }; // Fail-Open if Redis unavailable

    const geoKey = `fraud:geo:${fingerprint}`;
    const lastGeoRaw = await client.get(geoKey);

    let fraudResult: FraudCheckResult = { score: 0 };

    if (lastGeoRaw) {
      const fraudReason = await this.detectImpossibleTravel(
        lastGeoRaw,
        currentGeo
      );
      if (fraudReason) {
        fraudResult = { score: 50, reason: fraudReason };
      }
    }

    // Update last known location (24h TTL)
    await client.setEx(
      geoKey,
      86400,
      JSON.stringify({
        country: currentGeo.country,
        city: currentGeo.city,
        timestamp: Date.now(),
      })
    );

    return fraudResult;
  }

  private async detectImpossibleTravel(
    lastGeoRaw: string,
    currentGeo: { country: string; city: string }
  ): Promise<string | null> {
    try {
      const lastGeo: GeoLocation = JSON.parse(lastGeoRaw);

      // S14 Rule: Country change detected
      if (lastGeo.country !== currentGeo.country) {
        const timeDiff = Date.now() - lastGeo.timestamp;
        // If travel happened in less than 12 hours (Impossible Travel)
        if (timeDiff < 12 * 60 * 60 * 1000) {
          return `Impossible Travel detected: ${lastGeo.country} -> ${currentGeo.country}`;
        }
      }
    } catch (_e) {
      // Ignore parsing errors, cleaner overwrite
    }

    return null;
  }

  private checkBotPatterns(req: any): FraudCheckResult {
    if (
      !req.headers['user-agent'] ||
      req.headers['user-agent'].includes('Headless')
    ) {
      return { score: 40, reason: 'Anomalous User-Agent' };
    }

    return { score: 0 };
  }
}
