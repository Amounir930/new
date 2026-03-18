import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req, 
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { 
  JwtAuthGuard, 
  TenantJwtMatchGuard, 
  type TenantRequest 
} from '@apex/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@apex/config';
import crypto from 'node:crypto';

@Controller('merchant/upload-url')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantUploadController {
  private readonly logger = new Logger(MerchantUploadController.name);

  @Get()
  async getUploadUrl(
    @Req() req: TenantRequest,
    @Query('contentType') contentType: string
  ) {
    // S1 Check: Ensure authentication context is present
    if (!req.user) {
      throw new UnauthorizedException('Authentication context missing');
    }

    // S1 Check: Verify MinIO Credentials Presence (S1 Violation Prevention)
    if (!env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
      this.logger.error('S1 VIOLATION: MinIO Access/Secret keys are missing from environment');
      throw new InternalServerErrorException('Storage service configuration error');
    }

    // S3-Hardening: Server-Side Extension Derivation
    const ALLOWED_MIME_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };

    const extension = ALLOWED_MIME_TYPES[contentType];
    if (!extension) {
      throw new BadRequestException(
        'Invalid or unsupported file type. Only standard images (JPEG, PNG, WebP, SVG) are permitted.'
      );
    }

    const tenantId = req.user.tenantId;
    (req as any).auditTenantId = tenantId;
    const fileId = crypto.randomUUID();
    const key = `merchants/${tenantId}/logos/${fileId}.${extension}`;
    
    try {
      // Dedicated Presign Client using the Public URL (S3 Signature V4 Integrity)
      const s3PresignClient = new S3Client({
        endpoint: env.STORAGE_PUBLIC_URL,
        region: env.MINIO_REGION || 'us-east-1',
        credentials: {
          accessKeyId: env.MINIO_ACCESS_KEY,
          secretAccessKey: env.MINIO_SECRET_KEY,
        },
        forcePathStyle: true,
      });

      const command = new PutObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3PresignClient, command, { expiresIn: 300 });
      const publicUrl = `${env.STORAGE_PUBLIC_URL}/${key}`;

      return { uploadUrl, publicUrl };
    } catch (error) {
      // S5 Protocol: Log specific error for forensics, mask for client
      this.logger.error(`S3_PRESIGN_FAILURE: Failed to generate upload URL for tenant ${tenantId}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to initialize secure upload pipeline');
    }
  }
}
