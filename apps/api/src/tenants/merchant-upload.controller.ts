import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req, 
  BadRequestException,
  UnauthorizedException
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

/**
 * Server-Side Extension Derivation Dictionary
 * Prevents Extension Spoofing by mapping MIME types to trusted extensions
 */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

@Controller('merchant/upload-url')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantUploadController {
  private s3Client = new S3Client({
    endpoint: env.MINIO_ENDPOINT,
    region: 'us-east-1', // Required by SDK even for MinIO
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY!,
      secretAccessKey: env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
  });

  @Get()
  async getUploadUrl(
    @Req() req: TenantRequest,
    @Query('contentType') contentType: string
  ) {
    // S1 Check: Ensure authentication context is present
    if (!req.user) {
      throw new UnauthorizedException('Authentication context missing');
    }

    // S3-Hardening: Server-Side Extension Derivation
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
    
    const command = new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
      ContentType: contentType, // S3-Hardening: Explicit ContentType for Signature Integrity
    });

    // Generate Pre-signed URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

    /**
     * Public URL Transformation
     * Maps the internal MinIO path to the public-facing storage domain
     * Ensure STORAGE_PUBLIC_URL is configured (e.g., https://storage.60sec.shop)
     */
    const publicUrl = `${env.STORAGE_PUBLIC_URL}/${key}`;

    return { uploadUrl, publicUrl };
  }
}
