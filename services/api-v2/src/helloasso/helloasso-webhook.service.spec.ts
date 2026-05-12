import { NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { HelloAssoWebhookService } from './helloasso-webhook.service';

const SIGNATURE_KEY = 'super-secret-key';

function sign(body: string): string {
  return createHmac('sha256', SIGNATURE_KEY).update(body).digest('hex');
}

interface Mocks {
  service: HelloAssoWebhookService;
  paymentRepo: {
    findOne: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  api: { getPayment: jest.Mock };
  oauth: { getPartnerAccessToken: jest.Mock };
  updateQbExecute: jest.Mock;
}

function makeService(): Mocks {
  const updateQbExecute = jest.fn().mockResolvedValue({ affected: 1 });
  const updateQb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: updateQbExecute,
  };
  const paymentRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(updateQb),
  };
  const api = { getPayment: jest.fn() };
  const oauth = { getPartnerAccessToken: jest.fn().mockResolvedValue('partner-token') };
  const config = { webhookSignatureKey: SIGNATURE_KEY } as unknown as HelloAssoConfig;

  const service = new HelloAssoWebhookService(
    paymentRepo as unknown as Repository<HelloAssoPaymentEntity>,
    api as unknown as HelloAssoApiClient,
    oauth as unknown as HelloAssoOAuthService,
    config,
  );

  return { service, paymentRepo, api, oauth, updateQbExecute };
}

function buildBody(overrides: { data?: Record<string, unknown>; eventType?: string } = {}): string {
  return JSON.stringify({
    eventType: overrides.eventType ?? 'Payment',
    metadata: { id: 75698555 },
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
  });

  describe('payload filters', () => {
    it('ignores eventType != Payment', async () => {
      const m = makeService();
      const body = JSON.stringify({ eventType: 'Form', metadata: { id: 1 } });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('ignored_event_type:Form');
      expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns malformed_payload on missing data.id', async () => {
      const m = makeService();
      const body = JSON.stringify({ eventType: 'Payment', data: { state: 'Authorized' } });
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));
      expect(result.outcome).toBe('malformed_payload');
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
      helloAssoPaymentId: '13790',
    } as HelloAssoPaymentEntity;

    it('transitions pending → paid on Authorized state', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(localPayment);
      const body = buildBody({ data: { state: 'Authorized' } });

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('transitioned:pending→paid');
      expect(m.paymentRepo.createQueryBuilder).toHaveBeenCalled();
      const qb = m.paymentRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HelloAssoPaymentStatus.PAID,
          helloAssoPaymentId: '13790',
          helloAssoOrderId: '22707',
          paidAt: expect.any(Date),
        }),
      );
      expect(qb.where).toHaveBeenCalledWith(
        'id = :id AND status = :prerequisite',
        { id: 42, prerequisite: HelloAssoPaymentStatus.PENDING },
      );
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
      expect(qb.where).toHaveBeenCalledWith(
        'id = :id AND status = :prerequisite',
        { id: 42, prerequisite: HelloAssoPaymentStatus.PAID },
      );
    });

    it('idempotent: replay (UPDATE affected=0) reports noop_no_transition', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(localPayment);
      m.updateQbExecute.mockResolvedValue({ affected: 0 });
      const body = buildBody({ data: { state: 'Authorized' } });

      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('noop_no_transition_from:pending');
    });
  });

  describe('reconciliation', () => {
    it('cache hit: finds payment by helloasso_payment_id, no HelloAsso API call', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValueOnce({
        id: 42,
        status: HelloAssoPaymentStatus.PENDING,
        helloAssoPaymentId: '13790',
      } as HelloAssoPaymentEntity);
      const body = buildBody();

      await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(m.api.getPayment).not.toHaveBeenCalled();
      expect(m.oauth.getPartnerAccessToken).not.toHaveBeenCalled();
    });

    it('cache miss: falls back to GET /payments, then lookup by checkoutIntentId, then caches', async () => {
      const m = makeService();
      // First findOne (by helloasso_payment_id): null
      // Second findOne (by helloasso_checkout_intent_id): the local row
      m.paymentRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 99,
          status: HelloAssoPaymentStatus.PENDING,
          helloAssoCheckoutIntentId: '500001',
        } as HelloAssoPaymentEntity);
      m.api.getPayment.mockResolvedValue({
        id: 13790,
        amount: 1000,
        state: 'Authorized',
        order: { id: 22707, checkoutIntentId: 500001 },
      });

      const body = buildBody();
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(m.oauth.getPartnerAccessToken).toHaveBeenCalledTimes(1);
      expect(m.api.getPayment).toHaveBeenCalledWith({
        helloAssoPaymentId: 13790,
        accessToken: 'partner-token',
      });
      // Cache update on the local row
      expect(m.paymentRepo.update).toHaveBeenCalledWith(99, {
        helloAssoPaymentId: '13790',
      });
      expect(result.outcome).toBe('transitioned:pending→paid');
    });

    it('returns orphan_no_local_payment when nothing matches (no row, no checkoutIntentId)', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);
      m.api.getPayment.mockResolvedValue({
        id: 13790,
        amount: 1000,
        state: 'Authorized',
        order: { id: 22707 }, // no checkoutIntentId
      });

      const body = buildBody();
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('orphan_no_local_payment');
    });

    it('returns orphan_no_local_payment when HelloAsso GET fails', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);
      m.api.getPayment.mockRejectedValue(new Error('HelloAsso down'));

      const body = buildBody();
      const result = await m.service.handleWebhook(Buffer.from(body), headers(body));

      expect(result.outcome).toBe('orphan_no_local_payment');
    });
  });

  describe('reconcilePaymentById (Lot 6)', () => {
    it('happy path: GET /payments → Authorized → applies pending→paid transition', async () => {
      const m = makeService();
      const stored = {
        id: 42,
        status: HelloAssoPaymentStatus.PENDING,
        helloAssoPaymentId: '13790',
      } as HelloAssoPaymentEntity;
      const updated = {
        ...stored,
        status: HelloAssoPaymentStatus.PAID,
        helloAssoOrderId: '22707',
        paidAt: new Date(),
      } as HelloAssoPaymentEntity;
      // 1st findOne = load before, 2nd findOne = refresh after
      m.paymentRepo.findOne.mockResolvedValueOnce(stored).mockResolvedValueOnce(updated);
      m.api.getPayment.mockResolvedValue({
        id: 13790,
        amount: 1000,
        state: 'Authorized',
        order: { id: 22707 },
      });

      const result = await m.service.reconcilePaymentById(42);

      expect(m.oauth.getPartnerAccessToken).toHaveBeenCalledTimes(1);
      expect(m.api.getPayment).toHaveBeenCalledWith({
        helloAssoPaymentId: 13790,
        accessToken: 'partner-token',
      });
      // applyStatusTransition (qb mock affected=1)
      expect(m.paymentRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it('throws NotFoundException if payment id does not exist', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue(null);

      await expect(m.service.reconcilePaymentById(999)).rejects.toBeInstanceOf(NotFoundException);
      expect(m.api.getPayment).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntity if helloasso_payment_id missing (no webhook received yet)', async () => {
      const m = makeService();
      m.paymentRepo.findOne.mockResolvedValue({
        id: 42,
        status: HelloAssoPaymentStatus.PENDING,
        helloAssoPaymentId: null,
        helloAssoCheckoutIntentId: '500001',
      } as HelloAssoPaymentEntity);

      await expect(m.service.reconcilePaymentById(42)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(m.api.getPayment).not.toHaveBeenCalled();
    });
  });
});
