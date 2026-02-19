# S12: Cloudflare WAF Integration Guide 🛡️

To achieve full S12 compliance, APEX must be positioned behind Cloudflare WAF. This guide outlines the mandatory rules and configurations.

## 1. Zero Trust Access (S2/S5)
- All administrative endpoints (`super-admin.60sec.shop`) should be guarded by Cloudflare Access with MFA.

## 2. WAF Custom Rules (S11/S12)
- **High Sensitivity Bot Blocking**: Enable "Bot Fight Mode" and "Super Bot Fight Mode".
- **Rate Limiting (L7)**:
  - Match: `60sec.shop/api/*`
  - Limit: 100 requests per 1 minute (Symmetric to Traefik settings).
  - Action: Block/JS Challenge.
- **Suspicious Path Blocking**:
  - Match: `(http.request.uri.path contains ".env") or (http.request.uri.path contains "wp-admin")`
  - Action: Block.

## 3. DDoS Protection Settings
- **HTTP DDoS Protection**: Set to "High" or "I'm Under Attack" if abnormal traffic is detected.
- **Browser Integrity Check**: Enabled.

## 4. Encryption (S3)
- **SSL/TLS Mode**: Full (Strict).
- **Minimum TLS Version**: 1.3.
- **HSTS**: Enabled (Max Age: 6 months).

## 5. IP Whitelisting (S1/S2)
- Only allow traffic to the Origin server if it originates from Cloudflare's IP Ranges.
- Configure Traefik to trust Cloudflare CF-Connecting-IP headers.
