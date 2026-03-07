/**
 * Bun Shell Abstraction
 * Enables stable mocking in environments where global.Bun is readonly
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class BunShell {
  spawn(args: string[], options?: unknown) {
    return (Bun as { spawn: Function }).spawn(args, options);
  }

  write(path: string | URL, content: unknown) {
    return (Bun as { write: Function }).write(path, content);
  }

  file(path: string) {
    return (Bun as { file: Function }).file(path);
  }
}
