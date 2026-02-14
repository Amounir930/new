/**
 * S14: Fraud Detection - Geo-IP Validation
 * Constitution Reference: architecture.md (S14 Protocol)
 * Purpose: Detect geographic inconsistencies (Velocity per Geo)
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoIpService {
  /**
   * Mock implementation for Geo-IP lookup.
   * In production, this would use a MaxMind database or cloud service.
   */
  async getGeoData(ip: string): Promise<{
    country: string;
    city: string;
    lat: number;
    lon: number;
  } | null> {
    // Placeholder logic: 127.0.0.1 is Home, others are unknown for now
    if (ip === '127.0.0.1' || ip === '::1') {
      return { country: 'LOCAL', city: 'Home', lat: 0, lon: 0 };
    }

    // Return null if IP is not lookup-able locally
    return null;
  }

  /**
   * Detects "Impossible Travel" (jumping between countries/cities faster than physically possible)
   */
  async isImpossibleTravel(lastGeo: any, currentGeo: any): Promise<boolean> {
    if (!lastGeo || !currentGeo) return false;
    if (lastGeo.country !== currentGeo.country) {
      // Logic for travel time between countries can be added here
      return true; // Simplified: any country change in a short window is suspicious
    }
    return false;
  }
}
