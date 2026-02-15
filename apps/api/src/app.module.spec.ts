import { describe, expect, it } from 'bun:test';
import { AppModule } from './app.module.js';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });
});
