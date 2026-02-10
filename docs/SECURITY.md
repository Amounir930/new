# Security Policy & Bug Bounty Program

## 🔒 Security Policy

At 60sec.shop (KIMI), we take security seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## 🎯 Bug Bounty Program

### Scope

**In Scope:**
- *.60sec.shop domains
- API endpoints: api.60sec.shop
- Tenant isolation mechanisms
- Authentication and authorization systems
- Payment processing flows
- File upload/storage endpoints
- Admin panel functionality

**Out of Scope:**
- Third-party services (AWS, Stripe, etc.)
- Social engineering attacks
- Physical security
- DoS/DDoS attacks
- Rate limiting bypasses (unless business impact)

### Reward Structure

| Severity | Bounty Range | Examples |
|----------|-------------|----------|
| **Critical** | $2,000 - $5,000 | RCE, SQL Injection, Complete Data Breach |
| **High** | $500 - $1,500 | Authentication Bypass, Privilege Escalation |
| **Medium** | $100 - $500 | XSS, CSRF, Information Disclosure |
| **Low** | $50 - $100 | Best Practice Violations, Weak Configs |

*Bonuses available for exceptional reports with PoC and remediation suggestions*

### Eligibility

To be eligible for a bounty:
1. Be the first to report the vulnerability
2. Provide sufficient information to reproduce the issue
3. Do not exploit the vulnerability beyond proof-of-concept
4. Do not access, modify, or delete other users' data
5. Do not publicly disclose the vulnerability before it's fixed
6. Comply with all applicable laws

## 📋 Reporting a Vulnerability

### Via GitHub (Recommended)
We have enabled **GitHub Private Vulnerability Reporting**. 
Please use the **"Report a vulnerability"** button located under the **Security** tab of this repository. This creates a private draft security advisory that only our core security team can see.

### Via HackerOne
Submit reports at: [https://hackerone.com/60sec-shop](https://hackerone.com/60sec-shop) *(when active)*

### Via Email
Send encrypted reports to: **security@60sec.shop**

PGP Key:
```
-----BEGIN PGP PUBLIC KEY BLOCK-----
# PGP key will be provided here
-----END PGP PUBLIC KEY BLOCK-----
```

### What to Include

Your report should include:

1. **Vulnerability Type** (e.g., SQL Injection, XSS, IDOR)
2. **Affected URL/Endpoint**
3. **Severity Assessment** (with CVSS score if possible)
4. **Step-by-Step Reproduction**
5. **Proof of Concept** (PoC code, screenshots, videos)
6. **Impact Analysis**
7. **Suggested Fix** (optional but appreciated)

### Report Template

```markdown
**Title:** [Critical] SQL Injection in /api/v1/users

**Severity:** Critical (CVSS: 9.1)

**Description:**
The search endpoint is vulnerable to SQL injection via the 'q' parameter.

**Steps to Reproduce:**
1. Send GET request to: /api/v1/users?q=' OR '1'='1
2. Observe all users returned

**Proof of Concept:**
```bash
curl "https://api.60sec.shop/api/v1/users?q=' OR '1'='1"
```

**Impact:**
Complete database compromise, data exfiltration of all tenant data.

**Suggested Fix:**
Use parameterized queries (Drizzle ORM already implemented).

**Your Info:**
- Name: [Your name or handle]
- Email: [Your email]
- HackerOne: [Your profile] (optional)
- Want public credit? Yes/No
```

## ⏱️ Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Initial Response | 24 hours |
| Triage Complete | 72 hours |
| Bounty Decision | 7 days |
| Fix Deployed | 30-90 days (depending on severity) |
| Public Disclosure | After fix + your approval |

## 🛡️ Security Measures

Our security posture includes:

- **S1-S8 Security Gates**: Automated security validation
- **S9-S13 Penetration Testing**: Continuous security assessment
- **mTLS**: Mutual TLS for service-to-service communication
- **Secrets Rotation**: Automated credential rotation
- **Tenant Isolation**: Complete data segregation
- **Rate Limiting**: Multi-layer DDoS protection
- **Audit Logging**: Comprehensive activity tracking

## 🚫 Prohibited Activities

The following activities are strictly prohibited:

- Automated scanning without explicit permission
- Brute force attacks
- Physical security testing
- Social engineering
- Spam or phishing attempts
- Any activity that harms our users or infrastructure
- Extortion or ransomware attempts

## 🙏 Hall of Fame

We publicly thank researchers who have responsibly disclosed vulnerabilities:

| Researcher | Finding | Date |
|------------|---------|------|
| *Your name here* | | |

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HackerOne Disclosure Guidelines](https://www.hackerone.com/disclosure-guidelines)
- [ISO 29147 Vulnerability Disclosure](https://www.iso.org/standard/45170.html)

## Changes to This Policy

We may update this policy from time to time. Changes will be posted here with a revision date.

**Last Updated:** 2026-02-08

---

Thank you for helping keep 60sec.shop and our users safe! 🙏
