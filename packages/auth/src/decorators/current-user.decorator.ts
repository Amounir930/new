import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth.service';

export const currentUserFactory = (
  data: keyof AuthUser | undefined,
  ctx: ExecutionContext
): AuthUser | AuthUser[keyof AuthUser] | undefined => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  const user = request.user;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
