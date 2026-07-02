import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoWebhookKeysService } from './helloasso-webhook-keys.service';
import { HelloAssoWebhookService } from './helloasso-webhook.service';

const SIGNATURE_KEY = 'super-secret-key';

function sign(body: string): string {
  return createHmac('sha256', SIGNATURE_KEY).update(body).digest('hex');
}

interface Mocks {
  service: HelloAssoWebhookService;
  paymentRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  updateQbExecute: jest.Mock;
  detailsService: {
    setIsCashInCompliantBySlug: jest.Mock;
  };
  keysProvider: {
    getKeys: jest.Mock;
    refresh: jest.Mock;
  };
  notifications: {
    sendToUser: jest.Mock;
  };
}

function makeService(signatureKeys: string[] = [SIGNATURE_KEY]): Mocks {
  const updateQbExecute = jest.fn().mockResolvedValue({ affected: 1 });
  const updateQb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: updateQbExecute,
  };
  const paymentRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(updateQb),
  };
  const keysProvider = {
    getKeys: jest.fn().mockReturnValue(signatureKeys),
    refresh: jest.fn().mockResolvedValue(undefined),
  };
  const detailsService = {
    setIsCashInCompliantBySlug: jest.fn().mockResolvedValue(1),
  };
  const notifications = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  const service = new HelloAssoWebhookService(
    paymentRepo as unknown as Repository<HelloAssoPaymentEntity>,
    keysProvider as unknown as HelloAssoWebhookKeysService,
    detailsService as unknown as HelloAssoDetailsService,
    notifications as unknown as import('../notifications/notification.service').NotificationService,
  );

  return { service, paymentRepo, updateQbExecute, detailsService, keysProvider, notifications };
}

function buildBody(
  overrides: {
    data?: Record<string, unknown>;
    eventType?: string;
    metadata?: Record<string, unknown> | null;
  } = {},
): string {
  return JSON.stringify({
    eventType: overrides.eventType ?? 'Payment',
    metadata:
      overrides.metadata === null
        ? undefined
        : (overrides.metadata ?? { openDossardPaymentId: 42 }),
    data: {
      id: 13790,
      state: 'Authorized',
      order: { id: 22707 },
      ...(overrides.data ?? {}),
    },
  });
}

function headers(body: string): Record<string, string> {
  return { 'x-ha-signature': sign(body) };
}

describe('HelloAssoWebhookService', () => {
  describe('signature', () => {
    it('throws UnauthorizedException on invalid signature', async () => {
      const m = makeService();
      const body = buildBody();
      await expect(
        m.service.handleWebhook(Buffer.from(body), { 'x-ha-signature': 'deadbeef' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when no signature header', async () => {
      const m = makeService();
      const body = buildBody();
      await expect(m.service.handleWebhook(Buffer.from(body), {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('accepte un webhook signé avec la 2e clé configurée (try-both)', async () => {
      const SECOND_KEY = 'organization-signature-key';
      const m = makeService([SIGNATURE_KEY, SECOND_KEY]);
      // eventType ignoré → pas de traitement DB, on isole la vérif de signature.
      const body = buildBody({ eventType: 'Form' });
      const sig = createHmac('sha256', SECOND_KEY).update(body).digest('hex');
      const result = await m.service.handleWebhook(Buffer.from(body), { 'x-ha-signature': sig });
      expect(result.signatureValid).toBe(true);
      expect(result.outcome).toContain('ignored_event_type');
    });

    it('refresh-on-miss : cache vide → refresh() puis acceptation', async () => {
      const m = makeService([]); // cache initialement vide (HA injoignable au boot)
      const body = buildBody({ eventType: 'Form' });
      const sig = createHmac('sha256', SIGNATURE_KEY).update(body).digest('hex');
      // refresh() peuple le cache (comme un fetch HA réussi)
      m.keysProvider.refresh.mockImplementation(() => {
        m.keysProvider.getKeys.mockReturnValue([SIGNATURE_KEY]);
        return Promise.resolve();
      });
      const result = await m.service.handleWebhook(Buffer.from(body), { 'x-ha-signature': sig });
      expect(m.keysProvider.refresh).toHaveBeenCalledTimes(1);
      expect(result.signatureValid).toBe(true);
    });
  });

  describe('payload filters', () => {
    it('ignores eventType != Payment', async () => {
      const m = makeService();
      const body = JSON.stringify({ eventType: 'Form' });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('ignored_event_type:Form');
      expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns malformed_payload on missing data.id', async () => {
      const m = makeService();
      const body = JSON.stringify({
        eventType: 'Payment',
        metadata: { openDossardPaymentId: 42 },
        data: { state: 'Authorized' },
      });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('malformed_payload');
    });

    it('returns foreign_payment when metadata.openDossardPaymentId missing', async () => {
      const m = makeService();
      const body = buildBody({ metadata: null });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('foreign_payment');
      expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns noop_state for transient states (e.g. Pending)', async () => {
      const m = makeService();
      const body = buildBody({ data: { state: 'Pending' } });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('noop_state:Pending');
      expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('state machine', () => {
    const localPayment: HelloAssoPaymentEntity = {
      id: 42,
      status: HelloAssoPaymentStatus.PENDING,
    } as HelloAssoPaymentEntity;

    it('transitions pending → paid on Authorized state', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(localPayment);
      const body = buildBody({ data: { state: 'Authorized' } });

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(m.paymentRepo.findOne).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(result.outcome).toBe('transitioned:pending→paid');
      const qb = m.paymentRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HelloAssoPaymentStatus.PAID,
          helloAssoPaymentId: '13790',
          helloAssoOrderId: '22707',
          paidAt: expect.any(Date),
        }),
      );
      expect(qb.where).toHaveBeenCalledWith('id = :id AND status IN (:...prerequisites)', {
        id: 42,
        prerequisites: [HelloAssoPaymentStatus.PENDING, HelloAssoPaymentStatus.REFUSED],
      });
    });

    it('transitions refused → paid on Authorized (2e tentative réussie)', async () => {
      const m = makeService();
      const refused: HelloAssoPaymentEntity = {
        ...localPayment,
        status: HelloAssoPaymentStatus.REFUSED,
      } as HelloAssoPaymentEntity;
      m.paymentRepo.findOne.mockResolvedValue(refused);
      const body = buildBody({ data: { state: 'Authorized' } });

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('transitioned:refused→paid');
      const qb = m.paymentRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HelloAssoPaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      );
      expect(qb.where).toHaveBeenCalledWith('id = :id AND status IN (:...prerequisites)', {
        id: 42,
        prerequisites: [HelloAssoPaymentStatus.PENDING, HelloAssoPaymentStatus.REFUSED],
      });
    });

    it('maps Refused / Error / Abandoned / Canceled → refused', async () => {
      for (const state of ['Refused', 'Error', 'Abandoned', 'Canceled']) {
        const m = makeService();
        m.paymentRepo.findOne.mockResolvedValue(localPayment);
        const body = buildBody({ data: { state } });
        const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
        expect(result.outcome).toBe('transitioned:pending→refused');
      }
    });

    it('maps Refunded → refunded with prerequisite paid', async () => {
      const m = makeService();
      const paid: HelloAssoPaymentEntity = {
        ...localPayment,
        status: HelloAssoPaymentStatus.PAID,
      } as HelloAssoPaymentEntity;
      m.paymentRepo.findOne.mockResolvedValue(paid);
      const body = buildBody({ data: { state: 'Refunded' } });

      await m.service.handleWebhook(Buffer.from(body), headers(body));

      const qb = m.paymentRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.where).toHaveBeenCalledWith('id = :id AND status IN (:...prerequisites)', {
        id: 42,
        prerequisites: [HelloAssoPaymentStatus.PAID, HelloAssoPaymentStatus.REFUNDING],
      });
    });

    it('idempotent: replay (UPDATE affected=0) reports noop_no_transition', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(localPayment);
      m.updateQbExecute.mockResolvedValue({ affected: 0 });
      const body = buildBody({ data: { state: 'Authorized' } });

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('noop_no_transition_from:pending');
    });

    it('returns orphan_no_local_payment when openDossardPaymentId does not match any DB row', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);
      const body = buildBody();

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('orphan_no_local_payment');
    });
  });

  describe('Organization.IsCashinCompliant event', () => {
    function cashinBody(slug: string | undefined, value: unknown): string {
      return JSON.stringify({
        eventType: 'Organization.IsCashinCompliant',
        data: {
          organization_slug: slug,
          is_cashin_compliant: value,
        },
      });
    }

    it('updates the local link when slug matches (true)', async () => {
      const m = makeService();
      const body = cashinBody('club-de-judo', true);

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(m.detailsService.setIsCashInCompliantBySlug).toHaveBeenCalledWith(
        'club-de-judo',
        true,
      );
      expect(result.outcome).toBe('cashin_compliance_updated:club-de-judo:true');
      expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('updates the local link when slug matches (false)', async () => {
      const m = makeService();
      const body = cashinBody('club-de-judo', false);

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(m.detailsService.setIsCashInCompliantBySlug).toHaveBeenCalledWith(
        'club-de-judo',
        false,
      );
      expect(result.outcome).toBe('cashin_compliance_updated:club-de-judo:false');
    });

    it('returns orphan_no_local_link when slug is unknown locally', async () => {
      const m = makeService();
      m.detailsService.setIsCashInCompliantBySlug.mockResolvedValue(0);
      const body = cashinBody('unknown-slug', true);

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('orphan_no_local_link:unknown-slug');
    });

    it('returns malformed_cashin_compliance_payload when slug is missing', async () => {
      const m = makeService();
      const body = cashinBody(undefined, true);

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('malformed_cashin_compliance_payload');
      expect(m.detailsService.setIsCashInCompliantBySlug).not.toHaveBeenCalled();
    });

    it('returns malformed_cashin_compliance_payload when value is not boolean', async () => {
      const m = makeService();
      const body = cashinBody('club-de-judo', 'yes');

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('malformed_cashin_compliance_payload');
      expect(m.detailsService.setIsCashInCompliantBySlug).not.toHaveBeenCalled();
    });
  });
});
