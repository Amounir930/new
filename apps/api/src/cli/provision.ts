#!/usr/bin/env bun
/**
 * CLI Tool for Tenant Provisioning
 * Usage: bun run cli provision --subdomain=<name> --plan=<plan> --email=<email> --password=<pass> --store-name=<name>
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ProvisioningService } from '../provisioning/provisioning.service';

interface ProvisionOptions {
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  email: string;
  password?: string;
  storeName: string;
  quiet?: boolean;
}

/**
 * S10: Secure Password Input with Masking
 */
async function acquirePasswordSecurely(): Promise<string> {
  process.stdout.write('Enter admin password: ');

  let password = '';
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf-8');

  return new Promise<string>((resolve) => {
    const onData = (c: string) => {
      if (c === '\n' || c === '\r' || c === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
        return;
      }

      if (c === '\u0003') process.exit();

      const isBackspace = c === '\u007f' || c === '\b';
      if (isBackspace) {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }

      password += c;
      process.stdout.write('*');
    };
    stdin.on('data', onData);
  });
}

export async function main(args: string[] = process.argv.slice(2)) {
  const options = parseArgs(args);

  // 🛡️ S1/S10: Securely acquire password with masking
  if (!options.password && !options.quiet) {
    options.password = await acquirePasswordSecurely();
  }

  if (!options.password) {
    throw new Error('S1 Violation: Admin password is required.');
  }

  if (!options.quiet) {
    process.stdout.write(
      `\n🚀 Starting provisioning for: ${options.subdomain}\n`
    );
  }

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });

    const provisioningService = app.get<ProvisioningService>(
      'PROVISIONING_SERVICE'
    );

    const result = await provisioningService.provision({
      subdomain: options.subdomain,
      storeName: options.storeName,
      adminEmail: options.email,
      plan: options.plan || 'basic',
    });

    if (!options.quiet) {
      process.stdout.write('\n✅ Provisioning completed successfully\n');
      process.stdout.write(`   Tenant ID: ${result.subdomain}\n`);
      process.stdout.write(`   Duration: ${result.durationMs}ms\n`);
    }

    await app.close();
    return result;
  } catch (error) {
    process.stderr.write(
      `\n❌ Provisioning failed: ${error instanceof Error ? error.message : error}\n`
    );
    throw error;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: parsing logic
function parseArgs(args: string[]): ProvisionOptions {
  const options: Partial<ProvisionOptions> = {};

  for (const arg of args) {
    if (arg.startsWith('--subdomain=')) {
      options.subdomain = arg.split('=')[1];
    } else if (arg.startsWith('--plan=')) {
      const planValue = arg.split('=')[1];
      if (['free', 'basic', 'pro', 'enterprise'].includes(planValue)) {
        options.plan = planValue as ProvisionOptions['plan'];
      }
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
    process.stderr.write(`\n❌ Fatal CLI Error: ${err}\n`);
    process.exit(1);
  });
}
