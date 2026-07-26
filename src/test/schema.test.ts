import { describe, it, expect } from 'vitest';
import type { Account } from '@prisma/client';

describe('Prisma Schema Account model', () => {
  it('should match the better-auth account shape', () => {
    const account: Account = {
      id: 'acc-1',
      userId: 'user-1',
      accountId: 'prov-1',
      providerId: 'microsoft',
      refreshToken: null,
      accessToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      password: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(account.providerId).toBe('microsoft');
    expect(account.accountId).toBe('prov-1');
  });
});
