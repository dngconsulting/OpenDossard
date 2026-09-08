import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoPaymentService } from './helloasso-payment.service';

/**
 * Au-delà, un `pending` est considéré comme jamais finalisé. Seuil LOCAL et non
 * une vérité HelloAsso : `GET /checkout-intents/{id}` ne renvoie ni état ni date
 * d'expiration, seulement la commande « uniquement dans le cas où le paiement
 * est autorisé ». On ne peut donc pas demander à HelloAsso si un intent est mort.
 */
const EXPIRATION_THRESHOLD_MINUTES = 15;

/**
 * Plafond par run. Le premier passage en production trouvera l'arriéré de tous
 * les pendings jamais nettoyés ; sans plafond, il enverrait des centaines
 * d'appels à HelloAsso d'un coup. Le reliquat part au run suivant, 5 min après.
 */
const MAX_PER_RUN = 50;

export interface ExpirationRunSummary {
  candidates: number;
  /** Passés en `refused` + `status_source = 'expired'`. */
  expired: number;
  /** HelloAsso les avait autorisés : rattrapés en `paid` au lieu d'être expirés. */
  recovered: number;
  failed: number;
  durationMs: number;
  /** `true` quand un run était déjà en cours et que celui-ci a été ignoré. */
  skipped?: boolean;
}

/**
 * Expire les paiements restés `pending` sans que le coureur ait jamais saisi sa
 * carte — cas de loin le plus fréquent, qui imposait jusqu'ici une suppression
 * manuelle en base.
 *
 * **Interroge HelloAsso avant d'expirer.** C'est la garantie centrale : un
 * paiement qui aboutit après le seuil est rattrapé en `paid` au lieu d'être
 * détruit. Sans cet appel, le job industrialiserait le décalage OD ↔ HelloAsso
 * qu'il est censé réduire.
 *
 * **L'expiration reste réversible** : elle écrit `refused`, et
 * `prerequisitesForStatus(PAID)` contient `REFUSED` — un `Authorized` tardif
 * rattrape donc tout seul une expiration prononcée à tort. Une suppression
 * physique, elle, aurait été définitive : argent prélevé, coureur non inscrit,
 * aucune trace pour le support.
 *
 * Effet de bord voulu : `refused` sort de l'index unique partiel
 * `(competition_id, licence_id) WHERE status IN ('pending','paid')`, donc le
 * créneau est libéré et le coureur peut se réinscrire immédiatement.
 */
@Injectable()
export class HelloAssoPaymentExpirationService implements OnModuleInit {
  private readonly logger = new Logger(HelloAssoPaymentExpirationService.name);

  /** Empêche deux runs de traiter les mêmes paiements et de doubler les appels HelloAsso. */
  private running = false;

  constructor(
    private readonly payments: HelloAssoPaymentService,
    private readonly config: HelloAssoConfig,
  ) {}

  /**
   * Annonce l'état du job au démarrage. Sans ce log, savoir s'il est armé sur un
   * environnement donné imposerait d'attendre le prochain quart d'heure.
   */
  onModuleInit(): void {
    this.logger.log(
      this.config.paymentExpirationEnabled
        ? `Expiration des paiements ARMÉE (toutes les 5 min, seuil ${EXPIRATION_THRESHOLD_MINUTES} min)`
        : 'Expiration des paiements DÉSARMÉE (HELLOASSO_PAYMENT_EXPIRATION_ENABLED != "true")',
    );
  }

  @Cron('*/5 * * * *', { name: 'helloasso-payment-expiration' })
  async handleCron(): Promise<void> {
    // `findStalePendingIds` est HORS du try/catch par itération : une erreur de
    // requête — typiquement la migration pas encore appliquée juste après un
    // déploiement — s'échapperait dans l'ordonnanceur en rejet non géré, donc
    // fatale au process sous le défaut de Node. Toutes les 5 minutes.
    // Interrupteur : ce job mute des paiements en `refused` toutes les 5 min.
    // S'il se comporte mal, il doit pouvoir être arrêté sans redéploiement.
    // L'appel manuel, lui, reste ouvert — c'est ce qui permet de le tester sur
    // un environnement désarmé.
    if (!this.config.paymentExpirationEnabled) return;

    try {
      await this.expireStalePendings();
    } catch (e: unknown) {
      this.logger.error(
        `handleCron: run avorté — ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  /**
   * Public (et non porté par le seul `@Cron`) pour rester appelable par les
   * tests et par un déclenchement manuel d'exploitation, sans horloge à piloter.
   */
  async expireStalePendings(): Promise<ExpirationRunSummary> {
    if (this.running) {
      this.logger.warn('expireStalePendings: run déjà en cours, appel ignoré');
      return { candidates: 0, expired: 0, recovered: 0, failed: 0, durationMs: 0, skipped: true };
    }
    this.running = true;
    const startedAt = Date.now();

    let expired = 0;
    let recovered = 0;
    let failed = 0;
    let candidates = 0;

    try {
      // Passe 1 — les paiements qui n'ont JAMAIS atteint HelloAsso (pas de
      // checkout intent : l'appel a échoué à la création). Aucun argent ne peut
      // être engagé, donc aucune raison d'interroger HelloAsso.
      //
      // Traités à part parce qu'ils feraient échouer `refreshStatusFromHelloAsso`
      // à chaque run (`UnprocessableEntityException`) tout en occupant à vie le
      // budget trié par ancienneté : cinquante d'entre eux suffisent à ce que le
      // job ne nettoie plus jamais rien, tout en loggant de l'activité.
      const unreachable = await this.payments.findUnreachablePendingIds(
        EXPIRATION_THRESHOLD_MINUTES,
        MAX_PER_RUN,
      );
      for (const id of unreachable) {
        try {
          if (await this.payments.expirePending(id)) expired += 1;
        } catch (e: unknown) {
          failed += 1;
          this.logger.warn(
            `expireStalePendings: paymentId=${id} (sans intent) échec — ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }

      // Passe 2 — ceux qui ont bien un intent : on demande à HelloAsso.
      const ids = await this.payments.findStalePendingIds(
        EXPIRATION_THRESHOLD_MINUTES,
        MAX_PER_RUN,
      );
      candidates = unreachable.length + ids.length;

      // Séquentiel et jamais `Promise.all` : reste sous le rate limit HelloAsso
      // et limite à un paiement le rayon d'explosion d'une erreur.
      for (const id of ids) {
        // try/catch PAR itération : un paiement en échec ne doit pas avorter le
        // run, sinon un seul intent illisible bloquerait tout le nettoyage.
        try {
          const refreshed = await this.payments.refreshStatusFromHelloAsso(id);

          // HelloAsso connaît une transition : le paiement a abouti (ou a été
          // refusé) sans que le webhook nous parvienne. Surtout ne pas expirer.
          if (refreshed.outcome === 'transitioned') {
            recovered += 1;
            this.logger.log(
              `expireStalePendings: paymentId=${id} rattrapé via HelloAsso → ${refreshed.status}`,
            );
            continue;
          }

          // Garde-fou distinct, et le plus important : HelloAsso ne renvoie une
          // COMMANDE que si le paiement est autorisé. Son `state` peut pourtant
          // être hors mapping (`Registered`, `WaitingBankValidation`…), auquel
          // cas le refresh conclut `still_pending`. Expirer ici prendrait
          // l'argent sans inscrire le coureur — précisément ce que l'appel
          // pré-expiration doit empêcher.
          if (refreshed.hasHelloAssoOrder) {
            failed += 1;
            this.logger.error(
              `expireStalePendings: paymentId=${id} NON EXPIRÉ — HelloAsso a une commande ` +
                `(state=${refreshed.helloAssoState ?? '<none>'}) mais aucun état terminal mappé. ` +
                `Argent probablement engagé : à examiner manuellement.`,
            );
            continue;
          }

          // UPDATE gardé par `status = 'pending'` : un webhook concurrent qui
          // vient de faire passer le paiement à `paid` rend l'UPDATE no-op.
          if (await this.payments.expirePending(id)) {
            expired += 1;
          }
        } catch (e: unknown) {
          failed += 1;
          this.logger.warn(
            `expireStalePendings: paymentId=${id} échec retentable — ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }

      const durationMs = Date.now() - startedAt;
      if (candidates > 0) {
        this.logger.log(
          `expireStalePendings: run terminé — candidats=${candidates} expirés=${expired} ` +
            `rattrapés=${recovered} échecs=${failed} durationMs=${durationMs}`,
        );
      }
      return { candidates, expired, recovered, failed, durationMs };
    } finally {
      this.running = false;
    }
  }
}
