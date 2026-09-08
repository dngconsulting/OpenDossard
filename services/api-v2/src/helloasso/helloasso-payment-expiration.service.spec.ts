import { HelloAssoPaymentExpirationService } from './helloasso-payment-expiration.service';
import { HelloAssoPaymentService } from './helloasso-payment.service';

/**
 * Le job ne se contente pas de nettoyer : il interroge HelloAsso AVANT
 * d'expirer. Sans cet appel, il détruirait les paiements qui aboutissent après
 * le seuil — exactement le décalage OD ↔ HelloAsso qu'on cherche à corriger.
 */
describe('HelloAssoPaymentExpirationService', () => {
  function makeService() {
    const payments = {
      findStalePendingIds: jest.fn().mockResolvedValue([]),
      refreshStatusFromHelloAsso: jest.fn(),
      expirePending: jest.fn().mockResolvedValue(true),
    };
    const service = new HelloAssoPaymentExpirationService(
      payments as unknown as HelloAssoPaymentService,
    );
    return { service, payments };
  }

  it("ne fait rien quand aucun pending n'a dépassé le seuil", async () => {
    const m = makeService();
    const summary = await m.service.expireStalePendings();
    expect(summary).toMatchObject({ candidates: 0, expired: 0, recovered: 0, failed: 0 });
    expect(m.payments.refreshStatusFromHelloAsso).not.toHaveBeenCalled();
  });

  it('expire un pending que HelloAsso ne connaît pas', async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockResolvedValue([42]);
    m.payments.refreshStatusFromHelloAsso.mockResolvedValue({ outcome: 'still_pending' });

    const summary = await m.service.expireStalePendings();

    expect(m.payments.refreshStatusFromHelloAsso).toHaveBeenCalledWith(42);
    expect(m.payments.expirePending).toHaveBeenCalledWith(42);
    expect(summary).toMatchObject({ candidates: 1, expired: 1, recovered: 0 });
  });

  /**
   * Le cas qui justifie l'appel à HelloAsso : le coureur a bien payé, le webhook
   * n'est jamais arrivé. Expirer ici prendrait l'argent sans inscrire personne.
   */
  it("N'EXPIRE PAS un paiement que HelloAsso a autorisé — il le rattrape", async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockResolvedValue([42]);
    m.payments.refreshStatusFromHelloAsso.mockResolvedValue({
      outcome: 'transitioned',
      status: 'paid',
    });

    const summary = await m.service.expireStalePendings();

    expect(m.payments.expirePending).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ candidates: 1, expired: 0, recovered: 1 });
  });

  it("un paiement en échec n'interrompt pas le run", async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockResolvedValue([1, 2, 3]);
    m.payments.refreshStatusFromHelloAsso
      .mockRejectedValueOnce(new Error('HelloAsso down'))
      .mockResolvedValue({ outcome: 'still_pending' });

    const summary = await m.service.expireStalePendings();

    expect(summary).toMatchObject({ candidates: 3, expired: 2, failed: 1 });
  });

  it('un UPDATE sans effet (webhook concurrent) ne compte pas comme expiré', async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockResolvedValue([42]);
    m.payments.refreshStatusFromHelloAsso.mockResolvedValue({ outcome: 'still_pending' });
    m.payments.expirePending.mockResolvedValue(false);

    const summary = await m.service.expireStalePendings();

    expect(summary).toMatchObject({ candidates: 1, expired: 0 });
  });

  it('refuse un second run concurrent', async () => {
    const m = makeService();
    let release!: () => void;
    m.payments.findStalePendingIds.mockReturnValue(
      new Promise(resolve => {
        release = () => resolve([]);
      }),
    );

    const first = m.service.expireStalePendings();
    const second = await m.service.expireStalePendings();
    expect(second).toMatchObject({ candidates: 0, skipped: true });

    release();
    await first;
  });
});
