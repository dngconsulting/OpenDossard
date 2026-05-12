import { randomBytes } from 'node:crypto';
import { decryptToken, encryptToken } from './token-crypto.util';

const KEY = randomBytes(32);

describe('token-crypto', () => {
  describe('encryptToken / decryptToken roundtrip', () => {
    it('roundtrips an ASCII token', () => {
      const plain = 'hello-asso-access-token-xyz';
      expect(decryptToken(encryptToken(plain, KEY), KEY)).toBe(plain);
    });

    it('roundtrips a UTF-8 token with accents', () => {
      const plain = 'token-éà€-中文';
      expect(decryptToken(encryptToken(plain, KEY), KEY)).toBe(plain);
    });

    it('roundtrips a very long token (8KB)', () => {
      const plain = 'x'.repeat(8192);
      expect(decryptToken(encryptToken(plain, KEY), KEY)).toBe(plain);
    });

    it('produces different ciphertexts for the same plaintext (random IV)', () => {
      const plain = 'same-input';
      const a = encryptToken(plain, KEY);
      const b = encryptToken(plain, KEY);
      expect(a).not.toBe(b);
    });

    it('output is iv.authTag.ciphertext in base64url', () => {
      const enc = encryptToken('x', KEY);
      const parts = enc.split('.');
      expect(parts).toHaveLength(3);
      for (const p of parts) {
        expect(p).toMatch(/^[A-Za-z0-9\-_]+$/);
      }
    });
  });

  describe('integrity protection (GCM)', () => {
    it('rejects tampered ciphertext', () => {
      const enc = encryptToken('secret', KEY);
      const [iv, tag, ct] = enc.split('.');
      const tampered = Buffer.from(ct, 'base64url');
      tampered[0] ^= 0xff; // flip a bit
      const broken = `${iv}.${tag}.${tampered.toString('base64url')}`;
      expect(() => decryptToken(broken, KEY)).toThrow();
    });

    it('rejects a wrong auth tag', () => {
      const enc = encryptToken('secret', KEY);
      const [iv, tag, ct] = enc.split('.');
      const tampered = Buffer.from(tag, 'base64url');
      tampered[0] ^= 0xff;
      const broken = `${iv}.${tampered.toString('base64url')}.${ct}`;
      expect(() => decryptToken(broken, KEY)).toThrow();
    });

    it('rejects decryption with a different key', () => {
      const enc = encryptToken('secret', KEY);
      const otherKey = randomBytes(32);
      expect(() => decryptToken(enc, otherKey)).toThrow();
    });
  });

  describe('format validation', () => {
    it('throws on malformed payload (wrong segment count)', () => {
      expect(() => decryptToken('only-one-part', KEY)).toThrow(/format/i);
      expect(() => decryptToken('a.b', KEY)).toThrow(/format/i);
      expect(() => decryptToken('a.b.c.d', KEY)).toThrow(/format/i);
    });

    it('throws when key is not 32 bytes', () => {
      expect(() => encryptToken('x', randomBytes(16))).toThrow(/32 bytes/);
      expect(() => decryptToken('a.b.c', randomBytes(16))).toThrow(/32 bytes/);
    });
  });
});
