import type * as admin from 'firebase-admin';

import { DeviceTokenNotifsService } from './device-token-notifs.service';
import { NotificationService, PushContent } from './notification.service';

/**
 * Tests unitaires de l'envoi FCM multi-users : batching par 500 (limite
 * `sendEachForMulticast`), agrégation des compteurs, purge des tokens morts.
 * Firebase est mocké — le réseau n'est jamais touché.
 */
describe('NotificationService.sendToUsers', () => {
  const CONTENT: PushContent = { title: 'Épreuve', body: 'RDV 9h' };

  let sendEachForMulticast: jest.Mock;
  let devices: { findTokensByUsers: jest.Mock; removeTokens: jest.Mock };
  let service: NotificationService;

  const okResponse = (count: number) => ({
    successCount: count,
    failureCount: 0,
    responses: Array.from({ length: count }, () => ({ success: true })),
  });

  beforeEach(() => {
    sendEachForMulticast = jest.fn();
    devices = {
      findTokensByUsers: jest.fn(),
      removeTokens: jest.fn().mockResolvedValue(undefined),
    };
    const firebase = {
      messaging: () => ({ sendEachForMulticast }),
    } as unknown as admin.app.App;
    service = new NotificationService(firebase, devices as unknown as DeviceTokenNotifsService);
  });

  it('should not call FCM at all when targeted users have no token', async () => {
    devices.findTokensByUsers.mockResolvedValue([]);

    const result = await service.sendToUsers([1, 2, 3], CONTENT);

    expect(result).toEqual({ successCount: 0, failureCount: 0 });
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('should split tokens in batches of 500 and aggregate counts', async () => {
    const tokens = Array.from({ length: 600 }, (_, i) => `tok-${i}`);
    devices.findTokensByUsers.mockResolvedValue(tokens);
    sendEachForMulticast
      .mockResolvedValueOnce(okResponse(500))
      .mockResolvedValueOnce(okResponse(100));

    const result = await service.sendToUsers([1], CONTENT);

    expect(result).toEqual({ successCount: 600, failureCount: 0 });
    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
    const calls = sendEachForMulticast.mock.calls as [admin.messaging.MulticastMessage][];
    expect(calls[0][0].tokens).toHaveLength(500);
    expect(calls[1][0].tokens).toHaveLength(100);
    expect(calls[1][0].tokens[0]).toBe('tok-500');
  });

  it('should purge stale tokens reported by FCM and count failures', async () => {
    devices.findTokensByUsers.mockResolvedValue(['tok-ok', 'tok-dead', 'tok-transient']);
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 2,
      responses: [
        { success: true },
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        // Erreur transitoire (ex. quota) : PAS de purge.
        { success: false, error: { code: 'messaging/internal-error' } },
      ],
    });

    const result = await service.sendToUsers([1, 2], CONTENT);

    expect(result).toEqual({ successCount: 1, failureCount: 2 });
    expect(devices.removeTokens).toHaveBeenCalledWith(['tok-dead']);
  });

  it('should absorb a batch-level FCM failure: partial counts, no throw, purge still runs', async () => {
    const tokens = Array.from({ length: 600 }, (_, i) => `tok-${i}`);
    devices.findTokensByUsers.mockResolvedValue(tokens);
    sendEachForMulticast
      .mockResolvedValueOnce({
        successCount: 499,
        failureCount: 1,
        responses: [
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
          ...Array.from({ length: 499 }, () => ({ success: true })),
        ],
      })
      // 2e batch : échec INFRA (credentials, réseau) — la promesse rejette.
      .mockRejectedValueOnce(new Error('UNAUTHENTICATED'));

    const result = await service.sendToUsers([1], CONTENT);

    // Les 100 tokens du batch rejeté comptent en échec ; pas de 500 propagé.
    expect(result).toEqual({ successCount: 499, failureCount: 101 });
    expect(devices.removeTokens).toHaveBeenCalledWith(['tok-0']);
  });

  it('should pass notification content and data through to FCM', async () => {
    devices.findTokensByUsers.mockResolvedValue(['tok-1']);
    sendEachForMulticast.mockResolvedValue(okResponse(1));

    await service.sendToUsers([1], { ...CONTENT, data: { competitionId: '42' } });

    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['tok-1'],
      notification: { title: 'Épreuve', body: 'RDV 9h' },
      data: { competitionId: '42' },
    });
  });
});
