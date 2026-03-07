import { describe, expect, it } from 'bun:test';
import { MockFactory } from '@apex/test-utils';
import { CurrentUser, currentUserFactory } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(currentUserFactory).toBeDefined();
  });

  it('should return the user object when no data is passed', () => {
    const user = { id: '123', email: 'test@example.com', tenantId: 't1' };
    const ctx = MockFactory.createExecutionContext({ user });

    expect(currentUserFactory(undefined, ctx)).toEqual(user);
  });

  it('should return a specific property when data is passed', () => {
    const user = { id: '123', email: 'test@example.com', tenantId: 't1' };
    const ctx = MockFactory.createExecutionContext({ user });

    expect(currentUserFactory('email', ctx)).toBe('test@example.com');
  });

  it('should return undefined if request has no user', () => {
    const ctx = MockFactory.createExecutionContext({});

    expect(currentUserFactory(undefined, ctx)).toBeUndefined();
  });
});
