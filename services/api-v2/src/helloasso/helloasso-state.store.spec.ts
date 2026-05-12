import { UnauthorizedException } from '@nestjs/common';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoStateStore } from './helloasso-state.store';

function makeStore(ttlSeconds = 600): HelloAssoStateStore {
  // On instancie sans passer par ConfigService — le store ne lit que stateTtlSeconds.
  const config = { stateTtlSeconds: ttlSeconds } as HelloAssoConfig;
  return new HelloAssoStateStore(config);
}

describe('HelloAssoStateStore', () => {
  it('stores then consumes an entry, returning user and verifier', () => {
    const store = makeStore();
    store.put('s1', { userId: 42, codeVerifier: 'v1' });

    const entry = store.consume('s1');

    expect(entry.userId).toBe(42);
    expect(entry.codeVerifier).toBe('v1');
  });

  it('single-use: a second consume of the same state throws', () => {
    const store = makeStore();
    store.put('s1', { userId: 1, codeVerifier: 'v' });

    store.consume('s1');

    expect(() => store.consume('s1')).toThrow(UnauthorizedException);
  });

  it('unknown state throws UnauthorizedException', () => {
    const store = makeStore();
    expect(() => store.consume('does-not-exist')).toThrow(UnauthorizedException);
  });

  it('expired entry is purged and rejected', () => {
    const store = makeStore(60);
    const realNow = Date.now;
    const t0 = 1_000_000;
    Date.now = jest.fn(() => t0);
    store.put('s1', { userId: 1, codeVerifier: 'v' });

    // 61 s plus tard → expiré (TTL = 60 s)
    Date.now = jest.fn(() => t0 + 61_000);
    try {
      expect(() => store.consume('s1')).toThrow(UnauthorizedException);
      expect(store.size()).toBe(0);
    } finally {
      Date.now = realNow;
    }
  });

  it('keeps entries that are still within TTL', () => {
    const store = makeStore(60);
    const realNow = Date.now;
    const t0 = 1_000_000;
    Date.now = jest.fn(() => t0);
    store.put('s1', { userId: 1, codeVerifier: 'v' });

    Date.now = jest.fn(() => t0 + 30_000); // 30 s
    try {
      const entry = store.consume('s1');
      expect(entry.userId).toBe(1);
    } finally {
      Date.now = realNow;
    }
  });
});
