/**
 * Apex v2 Dedicated Worker Bootstrap
 * S14.7: Dedicated background processing service
 */

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');

  // Force ENABLE_WORKERS to true for this entry point
  process.env['ENABLE_WORKERS'] = 'true';

  // S14.7: Boot the main AppModule but without the HTTP/Express listener
  // This will initialize all modules and their providers (including workers)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  logger.log(
    '🏗️  Dedicated Worker Service Started (BullMQ + Persistent Events)'
  );

  // Keep the process alive
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, closing worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  process.stderr.write(`\nWorker failed to start: ${err}\n`);
  process.exit(1);
});
