#!/usr/bin/env bun
/**
 * CLI Tool for Tenant Provisioning
 * Usage: bun run cli provision --subdomain=<name> --plan=<plan> --email=<email> --password=<pass> --store-name=<name>
 */

import { createInterface } from 'node:readline/promises';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ProvisioningService } from '../provisioning/provisioning.service.js';

interface ProvisionOptions {
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  email: string;
  password?: string;
  storeName: string;
  quiet?: boolean;
}

export async function main(args: string[] = process.argv.slice(2)) {
  const options = parseArgs(args);

  // 🛡️ S1/S10: Securely acquire password with masking (Prevent shoulder-surfing/history leaks)
  if (!options.password && !options.quiet) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdout.write('Enter admin password: ');

    // Manual masking implementation using RawMode (S10)
    options.password = '';
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    await new Promise<void>((resolve) => {
      const onData = (c: string) => {
        if (c === '\n' || c === '\r' || c === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve();
          return;
        }
        if (c === '\u0003') process.exit(); // Ctrl+C
        if (c === '\u007f' || c === '\b') { // Backspace
          if (options.password!.length > 0) {
            options.password = options.password!.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          options.password! += c;
          process.stdout.write('*');
        }
      };
      stdin.on('data', onData);
    });

    rl.close();
  }

  if (!options.password) {
    throw new Error('S1 Violation: Admin password is required.');
  }

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

  if (!options.subdomain || !options.email || !options.storeName) {
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
