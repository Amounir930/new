/**
 * S8 FIX 7A: Magic Byte Validation + Polyglot Defense
 *
 * Two layers of defense against malicious file uploads:
 *
 * 1. MAGIC BYTE VALIDATION: Checks file signature to verify actual type
 *    (prevents renaming .html to .jpg)
 *
 * 2. POLYGLOT DEFENSE: Forces the output filename to UUID + detected extension
 *    and forces Content-Type based on magic bytes, not the client's claim.
 *    This defeats "GIFAR" attacks where a file is both a valid GIF AND
 *    contains executable JavaScript.
 *
 * 3. EXTENSION ENFORCEMENT: The returned metadata includes the safe filename
 *    and correct Content-Type to be used when uploading to MinIO.
 */

import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

// Known safe image magic bytes → MIME type mapping
const SIGNATURES: {
  prefix: Buffer;
  offset?: number;
  mime: string;
  ext: string;
}[] = [
  { prefix: Buffer.from([0xff, 0xd8, 0xff]), mime: 'image/jpeg', ext: 'jpg' },
  {
    prefix: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    mime: 'image/png',
    ext: 'png',
  },
  { prefix: Buffer.from('GIF87a'), mime: 'image/gif', ext: 'gif' },
  { prefix: Buffer.from('GIF89a'), mime: 'image/gif', ext: 'gif' },
];

// WEBP has a special structure: RIFF....WEBP
const WEBP_RIFF = Buffer.from('RIFF');
const WEBP_MARKER = Buffer.from('WEBP');

export interface ValidatedFile {
  /** Safe filename: UUID + correct extension (e.g. "a1b2c3d4.jpg") */
  safeFilename: string;
  /** Detected MIME type based on magic bytes (NOT client claim) */
  detectedMimeType: string;
  /** Original file buffer */
  buffer: Buffer;
}

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);

  /**
   * Validate file and return safe metadata for MinIO upload
   *
   * @param buffer - File content
   * @param originalFilename - Client-provided filename (UNTRUSTED)
   * @returns ValidatedFile with safe filename and forced MIME type
   * @throws BadRequestException if file type is not an allowed image
   */
  validateAndSanitize(
    buffer: Buffer,
    originalFilename?: string
  ): ValidatedFile {
    if (!buffer || buffer.length < 12) {
      throw new BadRequestException('S8: File too small or empty');
    }

    // Check WEBP first (special two-part signature)
    if (
      buffer.subarray(0, 4).equals(WEBP_RIFF) &&
      buffer.subarray(8, 12).equals(WEBP_MARKER)
    ) {
      return {
        safeFilename: `${randomUUID()}.webp`,
        detectedMimeType: 'image/webp',
        buffer,
      };
    }

    // Check standard signatures
    for (const sig of SIGNATURES) {
      const offset = sig.offset ?? 0;
      if (
        buffer.subarray(offset, offset + sig.prefix.length).equals(sig.prefix)
      ) {
        return {
          // POLYGLOT DEFENSE: UUID filename kills any malicious extension
          safeFilename: `${randomUUID()}.${sig.ext}`,
          // Force MIME type from magic bytes, not client claim
          detectedMimeType: sig.mime,
          buffer,
        };
      }
    }

    this.logger.warn(
      `S8 REJECTED: File "${originalFilename || 'unknown'}" ` +
        `Magic: ${buffer.subarray(0, 12).toString('hex')}`
    );

    throw new BadRequestException(
      'File type not allowed. Only JPEG, PNG, WEBP, and GIF images are accepted.'
    );
  }
}
