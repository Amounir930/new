import { ConfigService } from '@apex/config/service';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import type { VerifyCallback } from 'passport-google-oauth20';
import { type Profile, Strategy } from 'passport-google-oauth20';
import { verifyOAuthState } from '../oauth-state';

/**
 * Google OAuth2 Strategy for customer (storefront) authentication.
 *
 * Handles the OAuth2 flow with Google, extracting the user's profile
 * and email from Google's response.
 */
export interface GoogleCustomerProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  tenantSubdomain: string; // which storefront tenant this login is for
}

@Injectable()
export class GoogleCustomerStrategy extends PassportStrategy(
  Strategy,
  'google-customer'
) {
  private readonly logger = new Logger(GoogleCustomerStrategy.name);

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    if (!configService) {
      throw new Error(
        'ConfigService is missing in GoogleCustomerStrategy constructor'
      );
    }

    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error(
        'S1 Violation: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google OAuth'
      );
    }

    const callbackURL = configService.get('GOOGLE_CALLBACK_URL');

    if (!callbackURL) {
      throw new Error(
        'S7 Violation: GOOGLE_CALLBACK_URL is required for Google OAuth (no hardcoded fallbacks)'
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(
        new UnauthorizedException('No email found in Google profile'),
        false
      );
    }

    // S2 Compliance: Verify cryptographically signed state parameter
    const stateParam = req.query.state ? String(req.query.state) : '';
    if (!stateParam) {
      return done(
        new UnauthorizedException('Missing OAuth state parameter'),
        false
      );
    }

    // Get JWT secret for verification (same secret used for signing)
    const jwtSecret = this.configService.get('JWT_SECRET');
    if (!jwtSecret) {
      return done(
        new UnauthorizedException('Server configuration error'),
        false
      );
    }

    const tenantSubdomain = verifyOAuthState(stateParam, jwtSecret);
    if (!tenantSubdomain) {
      this.logger.warn('Invalid or expired OAuth state parameter');
      return done(
        new UnauthorizedException('Invalid or expired state parameter'),
        false
      );
    }

    const googleProfile: GoogleCustomerProfile = {
      googleId: profile.id,
      email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      avatarUrl: profile.photos?.[0]?.value || null,
      emailVerified: profile.emails?.[0]?.verified ?? false,
      tenantSubdomain,
    };

    this.logger.log(
      `[GOOGLE-AUTH] Google login for: ${email}, tenant: ${tenantSubdomain}`
    );

    return done(null, googleProfile);
  }
}
