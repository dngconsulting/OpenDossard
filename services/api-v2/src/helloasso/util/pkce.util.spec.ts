import { createHash } from 'node:crypto';
import { generatePkcePair, generateState } from './pkce.util';

describe('PKCE util', () => {
  describe('generatePkcePair', () => {
    it('produces a code_verifier with 43–128 chars in the RFC 7636 alphabet', () => {
      const { codeVerifier } = generatePkcePair();
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
      expect(codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('derives code_challenge = base64url(SHA256(code_verifier))', () => {
      const { codeVerifier, codeChallenge } = generatePkcePair();
      const expected = createHash('sha256').update(codeVerifier).digest('base64url');
      expect(codeChallenge).toBe(expected);
    });

    it('produces fresh values each call', () => {
      const a = generatePkcePair();
      const b = generatePkcePair();
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
      expect(a.codeChallenge).not.toBe(b.codeChallenge);
    });
  });

  describe('generateState', () => {
    it('produces a URL-safe string well under 500 chars', () => {
      const state = generateState();
      expect(state.length).toBeLessThan(500);
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('produces fresh values each call', () => {
      expect(generateState()).not.toBe(generateState());
    });
  });
});
