import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FraudScoringService } from './fraud-scoring.service.js';

@Injectable()
export class FraudGuard implements CanActivate {
  constructor(private readonly fraudService: FraudScoringService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Calculate risk score based on fingerprint, IP, and behavior (S14)
    const result = await this.fraudService.calculateScore(request);

    // S14 Critical: Threshold for blocking
    // 80+ is reserved for high-confidence fraud (e.g., impossible travel + high velocity)
    if (result.score >= 80) {
      console.warn(
        `[S14] Fraud Blocked: Score ${result.score} | Reasons: ${result.reasons.join(', ')}`
      );
      throw new ForbiddenException({
        message: 'Security violation: Suspicious activity detected',
        score: result.score,
        reasons: result.reasons,
      });
    }

    // Attach fraud score to request for downstream observability
    request.fraudScore = result;

    return true;
  }
}
