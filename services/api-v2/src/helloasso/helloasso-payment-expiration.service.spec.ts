import { HelloAssoPaymentExpirationService } from './helloasso-payment-expiration.service';
import { HelloAssoConfig } from './helloasso.config';
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
      findUnreachablePendingIds: jest.fn().mockResolvedValue([]),
    };
    const config = { paymentExpirationEnabled: true } as HelloAssoConfig;
    const service = new HelloAssoPaymentExpirationService(
      payments as unknown as HelloAssoPaymentService,
      config,
    );
    return { service, payments, config };
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

  /**
   * `GET /checkout-intents/{id}` ne renvoie une commande QUE si le paiement est
   * autorisé (spec HelloAsso). Mais son `state` peut être hors mapping
   * (`Registered`, `WaitingBankValidation`…), auquel cas le refresh conclut
   * `still_pending`. Expirer ici prendrait l'argent sans inscrire le coureur.
   */
  it("n'expire JAMAIS un paiement pour lequel HelloAsso a une commande", async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockResolvedValue([42]);
    m.payments.refreshStatusFromHelloAsso.mockResolvedValue({
      outcome: 'still_pending',
      hasHelloAssoOrder: true,
      helloAssoState: 'Registered',
    });

    const summary = await m.service.expireStalePendings();

    expect(m.payments.expirePending).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ candidates: 1, expired: 0 });
  });

  /**
   * `findStalePendingIds` est hors du try/catch par itération. Une erreur —
   * typiquement une migration pas encore appliquée juste après un déploiement —
   * s'échapperait dans l'ordonnanceur en rejet non géré, donc fatale au process
   * sous Node par défaut. Toutes les 5 minutes, sans interrupteur.
   */
  it("handleCron n'escalade jamais une erreur vers l'ordonnanceur", async () => {
    const m = makeService();
    m.payments.findStalePendingIds.mockRejectedValue(new Error('column does not exist'));

    await expect(m.service.handleCron()).resolves.toBeUndefined();
  });

  describe('interrupteur', () => {
    /**
     * Quatre bugs ont été trouvés dans ce job avant sa mise en service. S'il en
     * reste un, il doit pouvoir être arrêté sans redéploiement — comme son
     * jumeau HelloAssoTokenRefreshService, qui porte le même garde-fou.
     */
    it('désarmé, le cron ne touche à rien', async () => {
      const m = makeService();
      (m.config as { paymentExpirationEnabled: boolean }).paymentExpirationEnabled = false;

      await m.service.handleCron();

      expect(m.payments.findStalePendingIds).not.toHaveBeenCalled();
    });

    it('un appel manuel reste possible même désarmé', async () => {
      const m = makeService();
      (m.config as { paymentExpirationEnabled: boolean }).paymentExpirationEnabled = false;

      await m.service.expireStalePendings();

      expect(m.payments.findStalePendingIds).toHaveBeenCalled();
    });
  });

  /**
   * Un paiement sans `helloAssoCheckoutIntentId` n'a JAMAIS atteint HelloAsso :
   * aucun argent ne peut être engagé, et `refreshStatusFromHelloAsso` lèverait
   * une erreur permanente à chaque run. Sans traitement dédié, ces lignes
   * occupent à vie le budget trié par ancienneté et le job cesse de nettoyer
   * quoi que ce soit, tout en loggant de l'activité.
   */
  it("expire sans appeler HelloAsso les paiements qui ne l'ont jamais atteint", async () => {
    const m = makeService();
    m.payments.findUnreachablePendingIds.mockResolvedValue([7]);
    m.payments.findStalePendingIds.mockResolvedValue([]);

    const summary = await m.service.expireStalePendings();

    expect(m.payments.refreshStatusFromHelloAsso).not.toHaveBeenCalled();
    expect(m.payments.expirePending).toHaveBeenCalledWith(7);
    expect(summary).toMatchObject({ expired: 1 });
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
