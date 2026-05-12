import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoStateStore } from './helloasso-state.store';
import { HelloAssoOAuthService } from './helloasso-oauth.service';

function makeService(): {
  service: HelloAssoOAuthService;
  store: HelloAssoStateStore;
  config: HelloAssoConfig;
} {
  const config = {
    clientId: 'cid',
    clientSecret: 'csecret',
    oauthBaseUrl: 'https://auth.helloasso-sandbox.com',
    apiBaseUrl: 'https://api.helloasso-sandbox.com',
    redirectUri: 'https://test.opendossard.com/api-v2/helloasso/oauth/callback',
    stateTtlSeconds: 600,
    authorizeEndpoint: 'https://auth.helloasso-sandbox.com/authorize',
    tokenEndpoint: 'https://api.helloasso-sandbox.com/oauth2/token',
  } as HelloAssoConfig;
  const store = new HelloAssoStateStore(config);
  const service = new HelloAssoOAuthService(config, store);
  return { service, store, config };
}

describe('HelloAssoOAuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('prepareAuthorization', () => {
    it('builds an /authorize URL with all required PKCE+state params', () => {
      const { service } = makeService();

      const { authorizeUrl, state } = service.prepareAuthorization({ userId: 42, userEmail: 'test@example.com' });

      const url = new URL(authorizeUrl);
      expect(url.origin + url.pathname).toBe('https://auth.helloasso-sandbox.com/authorize');
      expect(url.searchParams.get('client_id')).toBe('cid');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://test.opendossard.com/api-v2/helloasso/oauth/callback',
      );
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(url.searchParams.get('state')).toBe(state);
    });

    it('stores (userId, codeVerifier) keyed by the returned state', () => {
      const { service, store } = makeService();

      const { state } = service.prepareAuthorization({ userId: 42, userEmail: 'test@example.com' });
      const entry = store.consume(state);

      expect(entry.userId).toBe(42);
      expect(entry.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('emits distinct states across calls', () => {
      const { service } = makeService();
      const a = service.prepareAuthorization({ userId: 1, userEmail: 'user1@example.com' });
      const b = service.prepareAuthorization({ userId: 1, userEmail: 'user1@example.com' });
      expect(a.state).not.toBe(b.state);
    });
  });

  describe('consumeCallback', () => {
    it('exchanges code → tokens and returns the organization_slug from HelloAsso', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 42, userEmail: 'test@example.com' });

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        jsonResponse(200, {
          access_token: 'AT',
          refresh_token: 'RT',
          token_type: 'bearer',
          expires_in: 1800,
          organization_slug: 'mon-club-cycliste',
        }),
      );

      const result = await service.consumeCallback({
        code: 'AUTH_CODE',
        state,
      });

      expect(result.userId).toBe(42); // sourcé du state, sert d'audit
      expect(result.organizationSlug).toBe('mon-club-cycliste');
      expect(result.tokens).toEqual({
        accessToken: 'AT',
        refreshToken: 'RT',
        tokenType: 'bearer',
        expiresIn: 1800,
        organizationSlug: 'mon-club-cycliste',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://api.helloasso-sandbox.com/oauth2/token');
      expect((calledInit as RequestInit).method).toBe('POST');
      expect((calledInit as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      const body = new URLSearchParams((calledInit as RequestInit).body as string);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('client_id')).toBe('cid');
      expect(body.get('client_secret')).toBe('csecret');
      expect(body.get('code')).toBe('AUTH_CODE');
      expect(body.get('redirect_uri')).toBe(
        'https://test.opendossard.com/api-v2/helloasso/oauth/callback',
      );
      expect(body.get('code_verifier')).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('rejects unknown / replayed state without calling HelloAsso', async () => {
      const { service } = makeService();
      const fetchSpy = jest.spyOn(global, 'fetch');

      await expect(service.consumeCallback({ code: 'X', state: 'unknown' })).rejects.toThrow();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('state is single-use: second callback with same state is rejected', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 42, userEmail: 'test@example.com' });

      jest.spyOn(global, 'fetch').mockResolvedValue(
        jsonResponse(200, {
          access_token: 'AT',
          refresh_token: 'RT',
          token_type: 'bearer',
          expires_in: 1800,
          organization_slug: 'mon-club',
        }),
      );

      await service.consumeCallback({ code: 'X', state });

      await expect(service.consumeCallback({ code: 'X', state })).rejects.toThrow();
    });

    it('rejects with BadGateway if HelloAsso omits organization_slug', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 42, userEmail: 'test@example.com' });

      jest.spyOn(global, 'fetch').mockResolvedValue(
        jsonResponse(200, {
          access_token: 'AT',
          refresh_token: 'RT',
          token_type: 'bearer',
          expires_in: 1800,
          // organization_slug volontairement absent
        }),
      );

      await expect(service.consumeCallback({ code: 'X', state })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('maps HelloAsso 400 to UnauthorizedException', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 1, userEmail: 'user1@example.com' });

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));

      await expect(service.consumeCallback({ code: 'X', state })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('maps HelloAsso 5xx to BadGatewayException', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 1, userEmail: 'user1@example.com' });

      jest.spyOn(global, 'fetch').mockResolvedValue(new Response('boom', { status: 503 }));

      await expect(service.consumeCallback({ code: 'X', state })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('maps a network failure to BadGatewayException', async () => {
      const { service } = makeService();
      const { state } = service.prepareAuthorization({ userId: 1, userEmail: 'user1@example.com' });

      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.consumeCallback({ code: 'X', state })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('POSTs grant_type=refresh_token and returns the new tokens', async () => {
      const { service } = makeService();

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        jsonResponse(200, {
          access_token: 'AT2',
          refresh_token: 'RT2',
          token_type: 'bearer',
          expires_in: '1800',
          organization_slug: 'my-club',
        }),
      );

      const tokens = await service.refreshTokens('OLD_RT');

      expect(tokens.accessToken).toBe('AT2');
      expect(tokens.refreshToken).toBe('RT2');
      expect(tokens.expiresIn).toBe(1800); // string normalisé en number

      const body = new URLSearchParams((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('client_id')).toBe('cid');
      expect(body.get('client_secret')).toBe('csecret');
      expect(body.get('refresh_token')).toBe('OLD_RT');
    });
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
