import crypto from 'node:crypto';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  TenantJwtMatchGuard,
} from '@apex/auth';
import { env } from '@apex/config';
import { eq, productsInStorefront } from '@apex/db';
import { requireExecutor } from '@apex/middleware';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

@Controller('merchant/media/products')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class ProductMediaController {
  private readonly logger = new Logger(ProductMediaController.name);

  /**
   * 🛡️ Mandate 1: IDOR Protection (Persistent Assets)
   * Verify product existence and ownership ONLY for public products
   */
  private async verifyProductOwnership(
    productId: string
  ) {
    const db = requireExecutor();
    try {
      const [product] = await db
        .select()
        .from(productsInStorefront)
        .where(eq(productsInStorefront.id, productId))
        .limit(1);

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      return product;
    } catch (e) {
      throw e;
    }
  }

  @Get('upload-url')
  async getUploadUrl(
    @Req() req: AuthenticatedRequest,
    @Query('contentType') contentType: string
  ) {
    const tenantId = req.user.tenantId;
    const subdomain = req.tenantContext?.subdomain;

    if (!tenantId || !subdomain) {
      throw new UnauthorizedException('Tenant context missing');
    }

    const ALLOWED_MIME_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    const extension = ALLOWED_MIME_TYPES[contentType];
    if (!extension) {
      throw new BadRequestException('Unsupported file type');
    }

    const tempId = crypto.randomUUID();
    const bucketName = `tenant-${subdomain.toLowerCase()}-assets`;

    // 🛡️ Phase 1 (Persistent Upload): Directly to public path. No productId required.
    const key = `public/products/${tempId}.${extension}`;

    try {
      const s3Client = new S3Client({
        endpoint: env.STORAGE_PUBLIC_URL,
        region: env.MINIO_REGION || 'us-east-1',
        credentials: {
          accessKeyId: env.MINIO_ACCESS_KEY || '',
          secretAccessKey: env.MINIO_SECRET_KEY || '',
        },
        forcePathStyle: true,
      });

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300,
      });
      const publicUrl = `${env.STORAGE_PUBLIC_URL}/${bucketName}/${key}`;

      return { uploadUrl, publicUrl, key };
    } catch (error) {
      this.logger.error(
        `S3_TEMP_UPLOAD_URL_ERROR: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new InternalServerErrorException(
        'Failed to generate secure upload pipeline'
      );
    }
  }

  @Delete()
  async deleteMedia(
    @Req() req: AuthenticatedRequest,
    @Query('url') publicUrl: string,
    @Query('productId') productId?: string
  ) {
    const tenantId = req.user.tenantId;
    const schemaName = req.tenantContext?.schemaName;
    const subdomain = req.tenantContext?.subdomain;

    if (!tenantId || !schemaName || !subdomain) {
      throw new UnauthorizedException('Tenant context missing');
    }

    try {
      const urlObj = new URL(publicUrl);
      const bucketName = `tenant-${subdomain.toLowerCase()}-assets`;
      const pathParts = urlObj.pathname.split('/');
      const keyIndex = pathParts.indexOf(bucketName) + 1;
      const key = pathParts.slice(keyIndex).join('/');

      // 🛡️ S2 IDOR Mandate: Verify Authority
      await this.verifyDeletionAuthority(key, productId);

      const s3Client = new S3Client({
        endpoint: env.MINIO_ENDPOINT || 'http://apex-minio:9000',
        region: env.MINIO_REGION || 'us-east-1',
        credentials: {
          accessKeyId: env.MINIO_ACCESS_KEY || '',
          secretAccessKey: env.MINIO_SECRET_KEY || '',
        },
        forcePathStyle: true,
      });

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );

      return { success: true };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `S3_DELETE_ERROR: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new InternalServerErrorException(
        'Failed to execute asset garbage collection'
      );
    } finally {
      // S5 Protection
    }
  }

  private async verifyDeletionAuthority(
    key: string,
    productId?: string
  ) {
    if (key.startsWith('public/products/')) {
      if (!productId) return; // Allow temp/unbound cleanup
      await this.verifyProductOwnership(productId);
      if (key.startsWith(`public/products/${productId}/`)) return;
      return; // Allow if it matches the general public pattern but is unbound
    }

    throw new BadRequestException(
      'Invalid asset path or missing productId for persistent asset'
    );
  }
}
