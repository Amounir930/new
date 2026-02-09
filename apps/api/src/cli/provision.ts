#!/usr/bin/env bun
/**
 * CLI Tool for Tenant Provisioning
 * Usage: bun run cli provision --subdomain=<name> --plan=<plan> --email=<email> --password=<pass> --store-name=<name>
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import type { ProvisioningService } from '../provisioning/provisioning.service.js';

interface ProvisionOptions {
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  email: string;
  password: string;
  storeName: string;
  quiet?: boolean;
}

export async function main(args: string[] = process.argv.slice(2)) {
  const options = parseArgs(args);

  if (!options.quiet) {
    console.log(`🚀 Starting provisioning for: ${options.subdomain}`);
  }

  try {
    // Create NestJS application context (without HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'], // Always show errors and warnings
    });

    const provisioningService = app.get<ProvisioningService>(
      'PROVISIONING_SERVICE'
    );

    // Execute provisioning
    const result = await provisioningService.provision({
      subdomain: options.subdomain,
      storeName: options.storeName,
      adminEmail: options.email,
      plan: options.plan || 'basic',
    });

    if (!options.quiet) {
      console.log('✅ Provisioning completed successfully');
      console.log(`   Tenant ID: ${result.subdomain}`);
      console.log(`   Duration: ${result.durationMs}ms`);
    }

    await app.close();
    return result;
  } catch (error) {
    console.error(
      '❌ Provisioning failed:',
      error instanceof Error ? error.message : error
    );
    // S5: Diagnostic info logic removed to prevent leaks
    throw error;
  }
}

function parseArgs(args: string[]): ProvisionOptions {
  const options: Partial<ProvisionOptions> = {};

  for (const arg of args) {
    if (arg.startsWith('--subdomain=')) {
      options.subdomain = arg.split('=')[1];
    } else if (arg.startsWith('--plan=')) {
      options.plan = arg.split('=')[1] as any;
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (arg.startsWith('--store-name=')) {
      options.storeName = arg.split('=')[1];
    } else if (arg === '--quiet') {
      options.quiet = true;
    }
  }

  if (
    !options.subdomain ||
    !options.email ||
    !options.password ||
    !options.storeName
  ) {
    throw new Error('Missing required arguments');
  }

  return options as ProvisionOptions;
}

// Only run if called directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('provision.ts')
) {
  main().catch((err) => {
    console.error('❌ Fatal CLI Error:', err);
    process.exit(1);
  });
}
