import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

/**
 * Sovereign Zod Validation Pipe
 * Refactored to eliminate all AJV and OpenAPI Metadata footprints.
 * Performance-optimized for Bun v1.1.25 environments.
 */
@Injectable()
export class SovereignZodPipe implements PipeTransform {
  public transform(value: unknown, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    // Check if the metatype is a Zod DTO (which has a static schema property)
    if (
      typeof metatype === 'function' &&
      'schema' in metatype &&
      metatype.schema &&
      typeof (metatype.schema as any).parse === 'function'
    ) {
      try {
        // Use the native Zod schema attached to the DTO
        return (metatype.schema as any).parse(value);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          });
        }
        throw new BadRequestException('Invalid value');
      }
    }

    return value;
  }
}
