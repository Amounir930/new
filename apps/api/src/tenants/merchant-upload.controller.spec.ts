import { Test, type TestingModule } from '@nestjs/testing';
import { MerchantUploadController } from './merchant-upload.controller';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((args) => args),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@apex/config', () => ({
  env: {
    MINIO_ENDPOINT: 'http://localhost:9000',
    MINIO_ACCESS_KEY: 'test-key',
    MINIO_SECRET_KEY: 'test-secret',
    MINIO_BUCKET: 'test-bucket',
    STORAGE_PUBLIC_URL: 'https://storage.60sec.shop',
  },
}));

describe('MerchantUploadController', () => {
  let controller: MerchantUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantUploadController],
    }).compile();

    controller = module.get<MerchantUploadController>(MerchantUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUploadUrl', () => {
    it('should return a pre-signed URL and public URL for valid MIME types', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/upload');
      
      const mockReq: any = {
        user: { tenantId: 'tenant-123' },
      };

      const result = await controller.getUploadUrl(mockReq, 'image/png');

      expect(result.uploadUrl).toBe('https://signed-url.com/upload');
      expect(result.publicUrl).toContain('merchants/tenant-123/logos/');
      expect(result.publicUrl).toContain('.png');
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should correctly derive extensions (Server-Side Extension Derivation)', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/upload');
      
      const mockReq: any = { user: { tenantId: 'tenant-123' } };

      const jpegResult = await controller.getUploadUrl(mockReq, 'image/jpeg');
      expect(jpegResult.publicUrl).toContain('.jpg');

      const webpResult = await controller.getUploadUrl(mockReq, 'image/webp');
      expect(webpResult.publicUrl).toContain('.webp');
    });

    it('should throw BadRequestException for unsupported MIME types', async () => {
      const mockReq: any = { user: { tenantId: 'tenant-123' } };
      
      await expect(
        controller.getUploadUrl(mockReq, 'application/pdf')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user context is missing', async () => {
      const mockReq: any = {};
      
      await expect(
        controller.getUploadUrl(mockReq, 'image/png')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
