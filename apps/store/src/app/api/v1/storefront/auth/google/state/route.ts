/**
 * Generate signed OAuth state for Google login
 * 
 * POST /api/v1/storefront/auth/google/state
 * Returns a cryptographically signed state token
 */
import { signOAuthState } from '@apex/auth/oauth-state';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Extract tenant from host
    const host = request.headers.get('host') || '';
    const parts = host.split('.');

    let tenantSubdomain = 'default';
    if (parts.length >= 3) {
      const subdomain = parts[0];
      const systemSubdomains = ['api', 'admin', 'www', 'super-admin', 'staging', 'localhost'];
      if (!systemSubdomains.includes(subdomain.toLowerCase())) {
        tenantSubdomain = subdomain;
      }
    }

    // Sign the state
    const signedState = signOAuthState(tenantSubdomain, secret);

    return NextResponse.json({ signedState });
  } catch (error) {
    console.error('Failed to generate signed OAuth state:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed state' },
      { status: 500 }
    );
  }
}
