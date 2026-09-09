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

    /**
     * Le cas le plus grave que cette table puisse représenter : HelloAsso a
     * AUTORISÉ le paiement, mais la ligne est restée `refused` — un autre
     * engagement occupe le créneau de l'index unique, la transition a été
     * refusée par PostgreSQL. L'argent est encaissé, le coureur n'est pas
     * inscrit, et rien ne se résoudra tout seul.
     *
     * Doit primer sur TOUTE autre cause, y compris la source OD : savoir que le
     * coureur avait annulé n'a plus aucune importance devant le fait qu'il a payé.
     */
    it('refusé alors que HelloAsso a autorisé → alerte, prime sur tout', () => {
      const d = describePaymentStatus({
        ...base,
        helloAssoLastState: 'Authorized',
        statusSource: PaymentStatusSource.USER_CANCEL,
      });

      expect(d.statusSeverity).toBe('error');
      expect(d.statusDetail).toContain('Payé chez HelloAsso');
      expect(d.statusDetail).toContain('arbitrage');
      // la cause OD ne doit PAS masquer l'alerte
      expect(d.statusDetail).not.toContain('Annulé par le coureur');
    });

    it('idem en sandbox (AuthorizedPreprod)', () => {
      expect(
        describePaymentStatus({ ...base, helloAssoLastState: 'AuthorizedPreprod' }).statusSeverity,
      ).toBe('error');
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
     * Cas réel : un pending est remplacé (source OD), puis HelloAsso signale que
     * la PREMIÈRE tentative avait en fait été refusée par la banque. Masquer ce
     * refus derrière « Remplacé » priverait le support de l'information qu'il
     * cherche — soit l'inverse de ce que cette feature promet.
     */
    it('expose la cause HelloAsso même quand une source OD est présente', () => {
      const d = describePaymentStatus({
        ...base,
        helloAssoLastState: 'Refused',
        statusSource: PaymentStatusSource.SUPERSEDED,
      });

      expect(d.statusDetail).toContain('Remplacé par une nouvelle tentative');
      expect(d.statusDetail).toContain('refusé par la banque');
      // La gravité reste celle de la décision OD : ce n'est pas CETTE ligne qui
      // a échoué, elle a été remplacée. La colorer en rouge ferait croire à un
      // échec de paiement.
      expect(d.statusSeverity).toBe('muted');
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
