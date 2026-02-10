/**
 * Bun Shell Abstraction
 * Enables stable mocking in environments where global.Bun is readonly
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class BunShell {
    spawn(args: string[], options?: any) {
        return Bun.spawn(args, options);
    }

    write(path: string | URL, content: any) {
        return Bun.write(path, content);
    }

    file(path: string) {
        return Bun.file(path);
    }
}
