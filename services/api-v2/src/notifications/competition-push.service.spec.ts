import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CompetitionPushService } from './competition-push.service';
import { NotificationService } from './notification.service';

/**
 * Tests unitaires du push organisateur — surtout le CONTRAT du payload FCM :
 * DossardeurV2 route les notifications sur `data.type` (cf. push paiement
 * `type: 'payment'` dans helloasso-webhook.service.ts). Le push épreuve doit
 * porter `type: 'competition'` + `competitionId` pour le deeplink.
 */
describe('CompetitionPushService.pushToStarrers', () => {
  const ADMIN: AuthenticatedUser = { id: 1, email: 'admin@test.com', roles: ['ADMIN'] };

  let favorites: { find: jest.Mock };
  let competitions: { findOne: jest.Mock };
  let authorization: { assertCompetitionAccess: jest.Mock };
  let notifications: { sendToUsers: jest.Mock };
  let service: CompetitionPushService;

  beforeEach(() => {
    favorites = { find: jest.fn() };
    competitions = { findOne: jest.fn() };
    authorization = { assertCompetitionAccess: jest.fn().mockResolvedValue(undefined) };
    notifications = {
      sendToUsers: jest.fn().mockResolvedValue({ successCount: 3, failureCount: 0 }),
    };
    service = new CompetitionPushService(
      favorites as never,
      competitions as never,
      authorization as unknown as AuthorizationService,
      notifications as unknown as NotificationService,
    );
  });

  it('should send the contract payload: title = competition name, data.type = competition', async () => {
    competitions.findOne.mockResolvedValue({ id: 42, clubId: 7, name: 'GP de Toulouse' });
    favorites.find.mockResolvedValue([{ userId: 10 }, { userId: 11 }]);

    const result = await service.pushToStarrers(ADMIN, 42, 'Départ avancé à 9h');

    expect(notifications.sendToUsers).toHaveBeenCalledWith([10, 11], {
      title: 'GP de Toulouse',
      body: 'Départ avancé à 9h',
      data: { type: 'competition', competitionId: '42' },
    });
    expect(result).toEqual({ targetedUsers: 2, sentDevices: 3 });
  });

  it('should check competition access before any send', async () => {
    competitions.findOne.mockResolvedValue({ id: 42, clubId: 7, name: 'GP' });
    favorites.find.mockResolvedValue([]);

    await service.pushToStarrers(ADMIN, 42, 'msg');

    expect(authorization.assertCompetitionAccess).toHaveBeenCalledWith(ADMIN, {
      id: 42,
      clubId: 7,
      name: 'GP',
    });
  });

  it('should throw 404 for an unknown competition without sending anything', async () => {
    competitions.findOne.mockResolvedValue(null);

    await expect(service.pushToStarrers(ADMIN, 999, 'msg')).rejects.toThrow(NotFoundException);
    expect(notifications.sendToUsers).not.toHaveBeenCalled();
  });

  it('should NOT loop over tokens when the caller is not authorized on the competition (403)', async () => {
    // SÉCURITÉ : un ORGANISATEUR non rattaché au club de l'épreuve (ou tout
    // appelant hors scope) ne doit JAMAIS atteindre la boucle d'envoi.
    const ORGA: AuthenticatedUser = { id: 9, email: 'orga@test.com', roles: ['ORGANISATEUR'] };
    competitions.findOne.mockResolvedValue({ id: 42, clubId: 7, name: 'GP' });
    favorites.find.mockResolvedValue([{ userId: 10 }, { userId: 11 }]);
    authorization.assertCompetitionAccess.mockRejectedValue(new ForbiddenException());

    await expect(service.pushToStarrers(ORGA, 42, 'msg')).rejects.toThrow(ForbiddenException);
    expect(notifications.sendToUsers).not.toHaveBeenCalled();
  });
});
