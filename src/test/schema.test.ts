import { describe, it, expect } from 'vitest';
import type { Account } from '@prisma/client';

describe('Prisma Schema Account model', () => {
  it('should have ext_expires_in field', () => {
    const account: Account = {
      id: 'acc-1',
      userId: 'user-1',
      type: 'oauth',
      provider: 'azure-ad',
      providerAccountId: 'prov-1',
      refresh_token: null,
      access_token: null,
      expires_at: null,
      token_type: null,
      scope: null,
      id_token: null,
      session_state: null,
      ext_expires_in: 3600,
    };
    expect(account.ext_expires_in).toBe(3600);
  });
});
