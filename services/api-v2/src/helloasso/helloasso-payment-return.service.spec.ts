import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
  PaymentStatusSource,
} from './entities/helloasso-payment.entity';
import { HelloAssoPaymentReturnService } from './helloasso-payment-return.service';
import { HelloAssoPaymentService } from './helloasso-payment.service';
import { HelloAssoPaymentTransitionService } from './helloasso-payment-transition.service';

function makeService() {
  const paymentRepo = { findOne: jest.fn() };
  const payments = { fetchCheckoutIntent: jest.fn() };
  const transitions = {
    apply: jest.fn().mockResolvedValue('updated'),
    notify: jest.fn().mockResolvedValue(undefined),
  };
  const service = new HelloAssoPaymentReturnService(
    paymentRepo as unknown as Repository<HelloAssoPaymentEntity>,
    payments as unknown as HelloAssoPaymentService,
    transitions as unknown as HelloAssoPaymentTransitionService,
  );
  return { service, paymentRepo, payments, transitions };
}

function pendingPayment(overrides: Partial<HelloAssoPaymentEntity> = {}): HelloAssoPaymentEntity {
  return {
    id: 1413,
    competitionId: 2519,
    licenceId: 23162,
    payerUserId: 704,
    status: HelloAssoPaymentStatus.PENDING,
    helloAssoCheckoutIntentId: '8211204',
    ...overrides,
  } as HelloAssoPaymentEntity;
}

const AUTHORIZED_INTENT = {
  id: 8211204,
  order: { id: 197921544, payments: [{ id: 100496969, state: 'Authorized' }] },
};

describe('HelloAssoPaymentReturnService', () => {
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    logSpies = (['log', 'warn'] as const).map(level =>
      jest.spyOn(Logger.prototype, level).mockImplementation(() => undefined),
    );
  });

  afterEach(() => logSpies.forEach(spy => spy.mockRestore()));

  /**
   * Incident du 10/11/2026 : retour `success` reçu à 21:27:19, webhook à
   * 21:31:24. Entre les deux, l'app a annulé la ligne restée `pending` et le
   * coureur a payé une seconde fois. La ligne doit passer `paid` dès le retour.
   */
  it('passe la ligne en paid dès le retour quand HelloAsso confirme Authorized', async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());
    m.payments.fetchCheckoutIntent.mockResolvedValue(AUTHORIZED_INTENT);

    await m.service.confirmFromReturnUrl('1413', '8211204');

    expect(m.payments.fetchCheckoutIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1413, helloAssoCheckoutIntentId: '8211204' }),
    );
    expect(m.transitions.apply).toHaveBeenCalledWith(
      expect.objectContaining({
        newStatus: HelloAssoPaymentStatus.PAID,
        statusSource: PaymentStatusSource.RETURN_URL,
        // Indispensable : le webhook de remboursement est rattaché par cet id.
        helloAssoPaymentId: 100496969,
        helloAssoOrderId: 197921544,
        helloAssoState: 'Authorized',
      }),
    );
    expect(m.transitions.notify).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1413 }),
      HelloAssoPaymentStatus.PAID,
    );
  });

  it("ne notifie pas si la transition n'a rien écrit (webhook arrivé entre-temps)", async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());
    m.payments.fetchCheckoutIntent.mockResolvedValue(AUTHORIZED_INTENT);
    m.transitions.apply.mockResolvedValue('noop');

    await m.service.confirmFromReturnUrl('1413', '8211204');

    expect(m.transitions.notify).not.toHaveBeenCalled();
  });

  it("n'écrit rien si HelloAsso ne renvoie aucun paiement autorisé (URL forgée)", async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());
    m.payments.fetchCheckoutIntent.mockResolvedValue({ id: 8211204 });

    await m.service.confirmFromReturnUrl('1413', '8211204');

    expect(m.transitions.apply).not.toHaveBeenCalled();
  });

  /**
   * Même règle que le refresh admin : seul le paiement HelloAsso le plus récent
   * fait foi. Un `Authorized` suivi d'un `Refused` ne vaut pas paiement.
   */
  it("n'écrit rien si le paiement HelloAsso le plus récent n'est pas autorisé", async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());
    m.payments.fetchCheckoutIntent.mockResolvedValue({
      order: {
        id: 197921544,
        payments: [
          { id: 1, state: 'Authorized' },
          { id: 2, state: 'Refused' },
        ],
      },
    });

    await m.service.confirmFromReturnUrl('1413', '8211204');

    expect(m.transitions.apply).not.toHaveBeenCalled();
  });

  it("refuse un intent qui n'est pas celui de la ligne, sans appeler HelloAsso", async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());

    await m.service.confirmFromReturnUrl('1413', '9999999');

    expect(m.payments.fetchCheckoutIntent).not.toHaveBeenCalled();
    expect(m.transitions.apply).not.toHaveBeenCalled();
  });

  it("n'appelle pas HelloAsso pour une ligne déjà payée", async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(
      pendingPayment({ status: HelloAssoPaymentStatus.PAID }),
    );

    await m.service.confirmFromReturnUrl('1413', '8211204');

    expect(m.payments.fetchCheckoutIntent).not.toHaveBeenCalled();
  });

  it.each([
    ['paymentId absent', undefined, '8211204'],
    ['paymentId non numérique', 'abc', '8211204'],
    ['paymentId répété (tableau)', ['1413', '1414'], '8211204'],
    ['checkoutIntentId absent', '1413', undefined],
  ])('ignore des paramètres invalides : %s', async (_label, paymentId, intentId) => {
    const m = makeService();

    await m.service.confirmFromReturnUrl(paymentId, intentId);

    expect(m.paymentRepo.findOne).not.toHaveBeenCalled();
  });

  it('ne propage jamais une erreur HelloAsso (appel sans await)', async () => {
    const m = makeService();
    m.paymentRepo.findOne.mockResolvedValue(pendingPayment());
    m.payments.fetchCheckoutIntent.mockRejectedValue(new Error('HelloAsso API unreachable'));

    await expect(m.service.confirmFromReturnUrl('1413', '8211204')).resolves.toBeUndefined();
    expect(m.transitions.apply).not.toHaveBeenCalled();
  });
});
