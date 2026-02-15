import type { ExecutionContext } from '@nestjs/common';
import 'reflect-metadata';
import { describe, expect, it } from 'bun:test';
import { CurrentUser, currentUserFactory } from './current-user.decorator.js';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(currentUserFactory).toBeDefined();
  });

  it('should return the user object when no data is passed', () => {
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, ctx)).toEqual(user);
  });

  it('should return a specific property when data is passed', () => {
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory('email', ctx)).toBe('test@example.com');
  });

  it('should return undefined if request has no user', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, ctx)).toBeUndefined();
  });
});
