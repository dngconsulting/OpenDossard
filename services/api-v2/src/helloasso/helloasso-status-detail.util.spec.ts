import { HelloAssoPaymentStatus, PaymentStatusSource } from './entities/helloasso-payment.entity';
import { describePaymentStatus } from './helloasso-status-detail.util';

/**
 * `refused` agrège six causes réellement distinctes. Ces tests fixent la seule
 * chose qui permet au support de les séparer : la phrase rendue à l'écran et la
 * sévérité associée. Un « Remplacé » affiché comme un échec ferait croire aux
 * organisateurs à des paiements ratés qui n'ont jamais existé.
 */
describe('describePaymentStatus', () => {
  const base = {
    status: HelloAssoPaymentStatus.REFUSED,
    helloAssoLastState: null,
    statusSource: null,
  };

  describe('états non terminaux', () => {
    it('pending sans état HelloAsso : en attente de confirmation', () => {
      expect(describePaymentStatus({ ...base, status: HelloAssoPaymentStatus.PENDING })).toEqual({
        statusDetail: 'Paiement en cours, en attente de confirmation',
        statusSeverity: 'info',
      });
    });

    it('pending pendant un 3-D Secure : le dit explicitement', () => {
      expect(
        describePaymentStatus({
          ...base,
          status: HelloAssoPaymentStatus.PENDING,
          helloAssoLastState: 'WaitingAuthentication',
          statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
        }),
      ).toEqual({
        statusDetail: 'Authentification bancaire (3-D Secure) en cours',
        statusSeverity: 'info',
      });
    });

    it('paid : aucune précision nécessaire', () => {
      expect(describePaymentStatus({ ...base, status: HelloAssoPaymentStatus.PAID })).toEqual({
        statusDetail: null,
        statusSeverity: 'success',
      });
    });

    it('refunding', () => {
      expect(describePaymentStatus({ ...base, status: HelloAssoPaymentStatus.REFUNDING })).toEqual({
        statusDetail: null,
        statusSeverity: 'info',
      });
    });

    it('refunded', () => {
      expect(describePaymentStatus({ ...base, status: HelloAssoPaymentStatus.REFUNDED })).toEqual({
        statusDetail: null,
        statusSeverity: 'info',
      });
    });
  });

  describe('les six causes de `refused`', () => {
    it('1. refus bancaire → échec', () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'Refused',
          statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
        }),
      ).toEqual({ statusDetail: 'Refusé par la banque', statusSeverity: 'error' });
    });

    it('2. erreur technique → échec', () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'Error',
          statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
        }),
      ).toEqual({ statusDetail: 'Échec technique côté HelloAsso', statusSeverity: 'error' });
    });

    it("3. abandon du tunnel → atténué, ce n'est pas un échec de paiement", () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'Abandoned',
          statusSource: PaymentStatusSource.ADMIN_REFRESH,
        }),
      ).toEqual({
        statusDetail: 'Tunnel de paiement quitté avant la fin',
        statusSeverity: 'muted',
      });
    });

    it('4. annulation côté HelloAsso → échec', () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'Canceled',
          statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
        }),
      ).toEqual({ statusDetail: 'Annulé côté HelloAsso', statusSeverity: 'error' });
    });

    it('5. annulation par le coureur → neutre, acte volontaire', () => {
      expect(
        describePaymentStatus({ ...base, statusSource: PaymentStatusSource.USER_CANCEL }),
      ).toEqual({ statusDetail: 'Annulé par le coureur', statusSeverity: 'neutral' });
    });

    it('6. paiement remplacé → atténué, le coureur a simplement recommencé', () => {
      expect(
        describePaymentStatus({ ...base, statusSource: PaymentStatusSource.SUPERSEDED }),
      ).toEqual({
        statusDetail: 'Remplacé par une nouvelle tentative de paiement',
        statusSeverity: 'muted',
      });
    });

    it('7. expiré par le job → atténué', () => {
      expect(describePaymentStatus({ ...base, statusSource: PaymentStatusSource.EXPIRED })).toEqual(
        {
          statusDetail: 'Expiré — paiement non finalisé dans les 15 minutes',
          statusSeverity: 'muted',
        },
      );
    });

    it('legacy : ligne antérieure au suivi détaillé', () => {
      expect(describePaymentStatus(base)).toEqual({
        statusDetail: 'Cause inconnue (paiement antérieur au suivi détaillé)',
        statusSeverity: 'error',
      });
    });
  });

  describe('précédences', () => {
    /**
     * Le job d'expiration appelle HelloAsso avant d'expirer : la ligne peut donc
     * porter à la fois un `helloAssoLastState` rapatrié et `statusSource=expired`.
     * La cause OD prime — c'est bien le job qui a décidé, pas la banque.
     */
    it('la source OD prime sur un état HelloAsso résiduel', () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'Pending',
          statusSource: PaymentStatusSource.EXPIRED,
        }),
      ).toEqual({
        statusDetail: 'Expiré — paiement non finalisé dans les 15 minutes',
        statusSeverity: 'muted',
      });
    });

    it('un état HelloAsso inconnu retombe sur le libellé legacy sans planter', () => {
      expect(
        describePaymentStatus({
          ...base,
          helloAssoLastState: 'EtatQueHelloAssoInventeraDemain',
          statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
        }),
      ).toEqual({
        statusDetail: 'Cause inconnue (paiement antérieur au suivi détaillé)',
        statusSeverity: 'error',
      });
    });
  });
});
