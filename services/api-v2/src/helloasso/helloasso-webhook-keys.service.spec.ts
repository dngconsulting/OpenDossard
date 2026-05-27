import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoWebhookKeysService } from './helloasso-webhook-keys.service';

function makeProvider(token = 'partner-token') {
  const config = { apiBaseUrl: 'https://api.helloasso.com' } as unknown as HelloAssoConfig;
  const getPartnerAccessToken = jest.fn().mockResolvedValue(token);
  const oauth = { getPartnerAccessToken } as unknown as HelloAssoOAuthService;
  const provider = new HelloAssoWebhookKeysService(config, oauth);
  return { provider, getPartnerAccessToken };
}

function mockFetchOnce(body: unknown, ok = true, status = 200): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('HelloAssoWebhookKeysService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('getKeys() est vide avant tout refresh', () => {
    const { provider } = makeProvider();
    expect(provider.getKeys()).toEqual([]);
  });

  it('refresh() met en cache les signatureKey de urlNotificationList', async () => {
    const { provider } = makeProvider();
    mockFetchOnce({
      urlNotificationList: [
        { apiNotificationType: 'Payment', signatureKey: 'key-pay' },
        { apiNotificationType: 'Organization', signatureKey: 'key-org' },
      ],
    });
    await provider.refresh();
    expect(provider.getKeys()).toEqual(['key-pay', 'key-org']);
  });

  it('refresh() dédoublonne et ignore les clés vides/nulles', async () => {
    const { provider } = makeProvider();
    mockFetchOnce({
      urlNotificationList: [
        { signatureKey: 'dup' },
        { signatureKey: 'dup' },
        { signatureKey: '' },
        { signatureKey: null },
      ],
    });
    await provider.refresh();
    expect(provider.getKeys()).toEqual(['dup']);
  });

  it('ne throw pas et garde le cache vide si HelloAsso est injoignable', async () => {
    const { provider } = makeProvider();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(provider.refresh()).resolves.toBeUndefined();
    expect(provider.getKeys()).toEqual([]);
  });

  it('garde le cache vide sur réponse HTTP non-OK', async () => {
    const { provider } = makeProvider();
    mockFetchOnce({}, false, 403);
    await provider.refresh();
    expect(provider.getKeys()).toEqual([]);
  });

  it('applique un cooldown : un 2e refresh rapproché ne rappelle pas HelloAsso', async () => {
    const { provider, getPartnerAccessToken } = makeProvider();
    mockFetchOnce({ urlNotificationList: [{ signatureKey: 'k1' }] });
    await provider.refresh();
    await provider.refresh(); // dans le cooldown → no-op
    expect(getPartnerAccessToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('onModuleInit ne bloque pas et ne throw pas si HA est down', () => {
    const { provider } = makeProvider();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('down'));
    expect(() => provider.onModuleInit()).not.toThrow();
  });
});
