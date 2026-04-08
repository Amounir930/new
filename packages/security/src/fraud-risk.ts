/**
 * Fraud Risk Scoring Utility
 *
 * Evaluates login attempts for fraud risk based on multiple signals.
 * Used to trigger additional verification steps for suspicious logins.
 *
 * @module @apex/security/fraud-risk
 */

export interface FraudRiskContext {
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** Email domain */
  emailDomain?: string;
  /** Whether this is a Google OAuth login */
  isOAuth: boolean;
  /** Number of failed login attempts in last 15 minutes */
  recentFailures: number;
  /** Whether the IP matches customer's historical IPs */
  isKnownIP: boolean;
  /** Time since last successful login (hours) */
  hoursSinceLastLogin: number | null;
  /** Whether the request came from an unusual geography */
  isUnusualGeography: boolean;
}

export interface FraudRiskResult {
  /** Risk score from 0 (safe) to 100 (high risk) */
  score: number;
  /** Risk level classification */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Recommended action */
  action: 'allow' | 'challenge' | 'block';
  /** Reasons for the risk score */
  reasons: string[];
}

/**
 * Score for recent failed login attempts
 */
function scoreRecentFailures(recentFailures: number): {
  score: number;
  reason: string | null;
} {
  if (recentFailures >= 5)
    return {
      score: 30,
      reason: `${recentFailures} failed attempts in last 15 minutes`,
    };
  if (recentFailures >= 3)
    return {
      score: 15,
      reason: `${recentFailures} failed attempts in last 15 minutes`,
    };
  if (recentFailures >= 1)
    return {
      score: 5,
      reason: `${recentFailures} failed attempt(s) in last 15 minutes`,
    };
  return { score: 0, reason: null };
}

/**
 * Score for unknown IP address
 */
function scoreUnknownIP(isKnownIP: boolean): {
  score: number;
  reason: string | null;
} {
  if (!isKnownIP)
    return { score: 20, reason: 'Login from unrecognized IP address' };
  return { score: 0, reason: null };
}

/**
 * Score for unusual geography
 */
function scoreUnusualGeography(isUnusualGeography: boolean): {
  score: number;
  reason: string | null;
} {
  if (isUnusualGeography)
    return { score: 15, reason: 'Login from unusual geographic location' };
  return { score: 0, reason: null };
}

/**
 * Score for disposable email domain
 */
function scoreDisposableEmail(
  isOAuth: boolean,
  emailDomain?: string
): { score: number; reason: string | null } {
  if (isOAuth || !emailDomain) return { score: 0, reason: null };

  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    '10minutemail.com',
  ];

  if (disposableDomains.includes(emailDomain.toLowerCase())) {
    return { score: 15, reason: `Disposable email domain: ${emailDomain}` };
  }
  return { score: 0, reason: null };
}

/**
 * Score for bot-like user agent
 */
function scoreBotUA(userAgent?: string): {
  score: number;
  reason: string | null;
} {
  if (!userAgent) return { score: 0, reason: null };

  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'headless',
    'puppeteer',
    'selenium',
  ];
  const ua = userAgent.toLowerCase();
  if (botPatterns.some((p) => ua.includes(p))) {
    return { score: 10, reason: 'Suspicious user agent detected' };
  }
  return { score: 0, reason: null };
}

/**
 * Score for long absence (>30 days)
 */
function scoreLongAbsence(hoursSinceLastLogin: number | null): {
  score: number;
  reason: string | null;
} {
  if (hoursSinceLastLogin !== null && hoursSinceLastLogin > 720) {
    return { score: 10, reason: 'Account inactive for >30 days' };
  }
  return { score: 0, reason: null };
}

/**
 * Calculate fraud risk score for a login attempt
 *
 * Scoring weights:
 * - Recent failures: 30 points max
 * - Unknown IP: 20 points
 * - Unusual geography: 15 points
 * - Disposable email domain: 15 points
 * - Bot-like user agent: 10 points
 * - Long absence (>30 days): 10 points
 */
export function calculateFraudRisk(context: FraudRiskContext): FraudRiskResult {
  const reasons: string[] = [];

  // Aggregate scores from independent risk signals
  const failureScore = scoreRecentFailures(context.recentFailures);
  const ipScore = scoreUnknownIP(context.isKnownIP);
  const geoScore = scoreUnusualGeography(context.isUnusualGeography);
  const emailScore = scoreDisposableEmail(context.isOAuth, context.emailDomain);
  const botScore = scoreBotUA(context.userAgent);
  const absenceScore = scoreLongAbsence(context.hoursSinceLastLogin);

  // Collect reasons
  if (failureScore.reason) reasons.push(failureScore.reason);
  if (ipScore.reason) reasons.push(ipScore.reason);
  if (geoScore.reason) reasons.push(geoScore.reason);
  if (emailScore.reason) reasons.push(emailScore.reason);
  if (botScore.reason) reasons.push(botScore.reason);
  if (absenceScore.reason) reasons.push(absenceScore.reason);

  // Calculate total score (capped at 100)
  const score = Math.min(
    100,
    failureScore.score +
      ipScore.score +
      geoScore.score +
      emailScore.score +
      botScore.score +
      absenceScore.score
  );

  // Determine risk level and action
  let level: FraudRiskResult['level'];
  let action: FraudRiskResult['action'];

  if (score >= 80) {
    level = 'critical';
    action = 'block';
  } else if (score >= 50) {
    level = 'high';
    action = 'challenge';
  } else if (score >= 25) {
    level = 'medium';
    action = 'challenge';
  } else {
    level = 'low';
    action = 'allow';
  }

  return { score, level, action, reasons };
}

/**
 * Extract email domain from email address
 */
export function extractEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if a user agent looks like a bot
 */
export function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'headless',
    'puppeteer',
    'selenium',
    'playwright',
    'curl',
    'wget',
    'axios',
    'node-fetch',
  ];
  const ua = userAgent.toLowerCase();
  return botPatterns.some((p) => ua.includes(p));
}
