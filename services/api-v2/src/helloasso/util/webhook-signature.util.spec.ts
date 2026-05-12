import { createHmac } from 'node:crypto';

import { verifyHelloAssoSignature } from './webhook-signature.util';

const KEY = 'super-secret-signature-key';

function hmac(body: string): string {
  return createHmac('sha256', KEY).update(body).digest('hex');
}

describe('verifyHelloAssoSignature', () => {
  const body = Buffer.from(JSON.stringify({ eventType: 'Payment', data: { id: 42 } }));

  it('returns true with valid signature in lowercase x-ha-signature header', () => {
    const headers = { 'x-ha-signature': hmac(body.toString()) };
    expect(verifyHelloAssoSignature(body, KEY, headers)).toBe(true);
  });

  it('returns false when header is missing', () => {
    expect(verifyHelloAssoSignature(body, KEY, {})).toBe(false);
  });

  it('returns false when signature is wrong', () => {
    const headers = { 'x-ha-signature': 'deadbeef' };
    expect(verifyHelloAssoSignature(body, KEY, headers)).toBe(false);
  });

  it('returns false when body is tampered', () => {
    const headers = { 'x-ha-signature': hmac(body.toString()) };
    const tampered = Buffer.from(body.toString().replace('42', '43'));
    expect(verifyHelloAssoSignature(tampered, KEY, headers)).toBe(false);
  });

  it('returns false when body is empty', () => {
    expect(verifyHelloAssoSignature(Buffer.alloc(0), KEY, { 'x-ha-signature': 'abc' })).toBe(false);
  });

  it('returns false when key is different', () => {
    const headers = { 'x-ha-signature': hmac(body.toString()) };
    expect(verifyHelloAssoSignature(body, 'wrong-key', headers)).toBe(false);
  });

  it('returns false when header is not valid hex', () => {
    const headers = { 'x-ha-signature': 'zzzz-not-hex' };
    expect(verifyHelloAssoSignature(body, KEY, headers)).toBe(false);
  });

  it('accepts a header value passed as an array (Node quirk)', () => {
    const headers = { 'x-ha-signature': [hmac(body.toString())] };
    expect(verifyHelloAssoSignature(body, KEY, headers)).toBe(true);
  });
});
