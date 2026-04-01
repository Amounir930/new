import { Injectable, Logger } from '@nestjs/common';
import { env } from '@apex/config';

@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);
  private readonly zoneId = env.CLOUDFLARE_ZONE_ID;
  private readonly apiToken = env.CLOUDFLARE_API_TOKEN;

  /**
   * S15 Active Defense: Create a Firewall Access Rule to block an IP
   * Documentation: https://api.cloudflare.com/#firewall-access-rules-for-a-zone-create-access-rule
   */
  async blockIp(ip: string, reason = 'S15 Honeytoken Violation'): Promise<boolean> {
    if (!this.zoneId || !this.apiToken) {
      this.logger.warn('S15: Cloudflare credentials missing. Skipping automated edge ban.');
      return false;
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/firewall/access_rules`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'block',
          configuration: {
            target: 'ip',
            value: ip,
          },
          notes: `${reason} - Automated by Apex Active Defense`,
        }),
      });

      const result = await response.json() as { success: boolean; errors: any[] };

      if (result.success) {
        this.logger.log(`🛡️ S15: Successfully created Cloudflare edge-block for IP: ${ip}`);
        return true;
      }

      // Check if IP is already blocked (Error code 10001)
      const isAlreadyBlocked = result.errors?.some(err => err.code === 10001);
      if (isAlreadyBlocked) {
        this.logger.debug(`S15: IP ${ip} is already blocked at Cloudflare edge.`);
        return true;
      }

      this.logger.error(`S15: Cloudflare API error: ${JSON.stringify(result.errors)}`);
      return false;
    } catch (error) {
      this.logger.error(`S15: Failed to communicate with Cloudflare API: ${(error as Error).message}`);
      return false;
    }
  }
}
