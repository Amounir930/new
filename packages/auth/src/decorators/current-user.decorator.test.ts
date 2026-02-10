import type { ExecutionContext } from '@nestjs/common';
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    capturedFactory: undefined as any,
  },
}));

vi.mock('@nestjs/common', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    createParamDecorator: (factory: any) => {
      mocks.capturedFactory = factory;
      return actual.createParamDecorator(factory);
    },
  };
});

import { CurrentUser } from './current-user.decorator.js';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(mocks.capturedFactory).toBeDefined();
  });

  it('should return the user object when no data is passed', () => {
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(mocks.capturedFactory(undefined, ctx)).toEqual(user);
  });

  it('should return a specific property when data is passed', () => {
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(mocks.capturedFactory('email', ctx)).toBe('test@example.com');
  });

  it('should return undefined if request has no user', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(mocks.capturedFactory(undefined, ctx)).toBeUndefined();
  });
});
