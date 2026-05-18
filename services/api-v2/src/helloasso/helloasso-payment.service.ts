import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PricingInfo } from '../common/types';
import { CheckoutIntentCreatedDto } from './dto/checkout-intent-created.dto';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { HelloAssoPaymentDto } from './dto/helloasso-payment.dto';
import { RefreshPaymentStatusDto } from './dto/refresh-payment-status.dto';
import { HelloAssoApiClient, CheckoutIntentRequestBody } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { mapHelloAssoState } from './helloasso-state.util';
import { truncate } from '../common/utils/string.util';
import {
  appendPaymentId,
  parseTarifAmount,
  toPaymentDto,
  toPaymentListDto,
} from './helloasso-payment.mapper';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';

export interface CreatePaymentInput {
  dto: CreateCheckoutIntentDto;
  payerUserId: number;
}

/**
 * Orchestration des paiements HelloAsso côté OpenDossard.
 *
 * Flow `createCheckoutIntent` :
 *   1. Validations (compétition, online activé, club lié HelloAsso, tarif, licence, anti-doublon)
 *   2. INSERT `helloasso_payment` (status=pending, intent_id=NULL)
 *   3. POST `/v5/organizations/{slug}/checkout-intents` via {@link HelloAssoApiClient}
 *   4. UPDATE `helloasso_payment.helloasso_checkout_intent_id`
 *   5. Retourne `{ paymentId, redirectUrl }` à l'app
 *
 * Si étape 3 ou 4 échoue → rollback DB (DELETE de la ligne pending pour éviter
 * un blocage anti-doublon). L'éventuel intent créé côté HelloAsso devient orphelin
 * (acceptable : HelloAsso ne facture rien tant que le user n'a pas payé).
 */
@Injectable()
export class HelloAssoPaymentService {
  private readonly logger = new Logger(HelloAssoPaymentService.name);

  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepo: Repository<CompetitionEntity>,
    @InjectRepository(LicenceEntity)
    private readonly licenceRepo: Repository<LicenceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly helloAssoDetails: HelloAssoDetailsService,
    private readonly helloAssoApi: HelloAssoApiClient,
    private readonly config: HelloAssoConfig,
  ) {}

  async createCheckoutIntent(input: CreatePaymentInput): Promise<CheckoutIntentCreatedDto> {
    const { dto, payerUserId } = input;

    const payer = await this.userRepo.findOne({ where: { id: payerUserId } });
    if (!payer) {
      throw new NotFoundException(`User #${payerUserId} introuvable (JWT lookup KO)`);
    }
    const payerFirebaseUid = payer.firebaseUid ?? null;

    const competition = await this.competitionRepo.findOne({ where: { id: dto.competitionId } });
    if (!competition) {
      throw new NotFoundException(`Compétition #${dto.competitionId} introuvable`);
    }
    if (!competition.onlineRegistrationEnabled) {
      throw new UnprocessableEntityException(
        `L'organisateur a désactivé le paiement en ligne pour cette épreuve.`,
      );
    }
    if (!competition.clubId) {
      throw new UnprocessableEntityException(
        `Cette épreuve n'est rattachée à aucun club — paiement HelloAsso impossible`,
      );
    }

    const details = await this.helloAssoDetails.findByClubId(competition.clubId);
    if (!details) {
      throw new UnprocessableEntityException(
        `Le club organisateur n'est pas lié à HelloAsso — paiement impossible`,
      );
    }

    const tarif = this.findTarif(competition.pricing, dto.tarifName);
    if (!tarif) {
      throw new NotFoundException(`Tarif "${dto.tarifName}" introuvable sur cette épreuve`);
    }
    const amountEuros = parseTarifAmount(tarif.tarif);
    if (amountEuros == null) {
      throw new UnprocessableEntityException(
        `Tarif "${dto.tarifName}" non parsable en montant numérique (paiement en ligne activé)`,
      );
    }
    const amountCents = Math.round(amountEuros * 100);

    const licence = await this.licenceRepo.findOne({
      where: { licenceNumber: dto.licenceNumber },
    });
    if (!licence) {
      throw new NotFoundException(`Licence "${dto.licenceNumber}" introuvable`);
    }

    const existing = await this.paymentRepo.findOne({
      where: {
        competitionId: competition.id,
        licenceId: licence.id,
        status: In([HelloAssoPaymentStatus.PENDING, HelloAssoPaymentStatus.PAID]),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Cette licence est déjà engagée sur cette épreuve (paiement #${existing.id}, statut ${existing.status})`,
      );
    }

    // 2. INSERT pending row (intent_id=NULL — sera renseigné après HelloAsso).
    // `tarif_id` est varchar(255) et stocke directement le label du tarif.
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        competitionId: competition.id,
        licenceId: licence.id,
        payerUserId,
        payerFirebaseUid,
        payerFirstName: dto.payerProfile.firstName,
        payerLastName: dto.payerProfile.lastName,
        helloAssoCheckoutIntentId: null,
        status: HelloAssoPaymentStatus.PENDING,
        tarifId: tarif.name,
        amountCents,
      }),
    );

    // 3. Appel HelloAsso via withHelloAssoClubAccessToken (gère refresh-on-401 inline).
    // On passe le `amountCents` déjà calculé (single source of truth) plutôt
    // que de re-parser `tarif.tarif` côté builder.
    let intentResponse: { id: number; redirectUrl: string };
    try {
      intentResponse = await this.helloAssoDetails.withHelloAssoClubAccessToken(
        competition.clubId,
        accessToken =>
          this.helloAssoApi.createCheckoutIntent({
            organizationSlug: details.organizationSlug,
            accessToken,
            body: this.buildCheckoutBody({
              payment,
              competition,
              licence,
              tarif,
              amountCents,
              payerProfile: dto.payerProfile,
            }),
          }),
      );
    } catch (e: unknown) {
      // Rollback : suppression de la ligne pending pour ne pas bloquer un retry
      await this.paymentRepo.delete(payment.id);
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `createCheckoutIntent: HelloAsso API failed (rolled back payment ${payment.id}): ${msg}`,
      );
      throw e;
    }

    // 4. UPDATE intent_id
    await this.paymentRepo.update(payment.id, {
      helloAssoCheckoutIntentId: String(intentResponse.id),
    });

    this.logger.log(
      `createCheckoutIntent: paymentId=${payment.id} competition=${competition.id} licence=${licence.id} tarif="${tarif.name}" amount=${amountEuros}€ intentId=${intentResponse.id}`,
    );

    return { paymentId: payment.id, redirectUrl: intentResponse.redirectUrl };
  }

  async findByIdForOwner(paymentId: number, payerUserId: number): Promise<HelloAssoPaymentDto> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Paiement #${paymentId} introuvable`);
    }
    if (payment.payerUserId !== payerUserId) {
      throw new ForbiddenException(`Vous n'êtes pas le payeur de ce paiement`);
    }
    return toPaymentDto(payment);
  }

  /**
   * Annulation explicite par le payeur (appel app au deep link
   * `payment/cancelled`). Marque le `pending` en `refused` pour libérer
   * immédiatement le partial unique index `(competition, licence) WHERE
   * status IN ('pending','paid')` sans attendre le webhook HelloAsso
   * `Canceled` (qui peut traîner ou ne jamais arriver si l'user a juste
   * fermé le webview).
   *
   * Idempotent et race-safe :
   *  - UPDATE atomique guarded par `status = 'pending'` (même pattern
   *    que `applyStatusTransition` côté webhook)
   *  - Si le webhook a transitioné entre-temps (paid/refused/refunded),
   *    le WHERE ne matche pas → 0 row affected → on retourne l'état
   *    courant rafraîchi sans erreur
   *  - Un webhook ultérieur `Canceled` arrivant après ce cancel app
   *    sera lui-même un no-op grâce au même guard
   *
   * Auth : `payerUserId` doit matcher `payment.payerUserId` (extrait du
   * JWT côté controller). 403 sinon.
   */
  async cancelByOwner(paymentId: number, payerUserId: number): Promise<HelloAssoPaymentDto> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Paiement #${paymentId} introuvable`);
    }
    if (payment.payerUserId !== payerUserId) {
      throw new ForbiddenException(`Vous n'êtes pas le payeur de ce paiement`);
    }

    if (payment.status !== HelloAssoPaymentStatus.PENDING) {
      this.logger.log(
        `cancelByOwner: paymentId=${paymentId} already in status=${payment.status} (no-op)`,
      );
      return toPaymentDto(payment);
    }

    const result = await this.paymentRepo
      .createQueryBuilder()
      .update(HelloAssoPaymentEntity)
      .set({ status: HelloAssoPaymentStatus.REFUSED })
      .where('id = :id AND status = :prerequisite', {
        id: payment.id,
        prerequisite: HelloAssoPaymentStatus.PENDING,
      })
      .execute();

    if ((result.affected ?? 0) > 0) {
      this.logger.log(`cancelByOwner: paymentId=${paymentId} pending→refused`);
      return toPaymentDto({ ...payment, status: HelloAssoPaymentStatus.REFUSED });
    }
    // Race avec un webhook qui a transitioné entre le findOne et l'UPDATE :
    // refetch pour un DTO refletant le vrai état final.
    const fresh = await this.paymentRepo.findOne({ where: { id: paymentId } });
    this.logger.log(
      `cancelByOwner: paymentId=${paymentId} race-with-webhook, current=${fresh?.status ?? 'gone'}`,
    );
    return toPaymentDto(fresh ?? payment);
  }

  /**
   * Action admin — re-synchronise le statut d'un paiement bloqué en `pending`
   * en interrogeant directement HelloAsso (`GET /v5/organizations/{slug}/
   * checkout-intents/{id}`). Utile quand l'utilisateur a abandonné la mire
   * sans déclencher d'event webhook côté HelloAsso (cas Steve : webview fermée
   * → aucun `Canceled`/`Abandoned` envoyé).
   *
   * Comportement :
   *  - payment `status != pending` → no-op idempotent (`outcome: no_change`)
   *  - payment sans `intentId` (rollback orphelin) → 422
   *  - HelloAsso retourne un `payment` dans un état mappé (Authorized, Refused,
   *    Abandoned, Canceled, Refunded) → applique la transition via
   *    `applyStatusTransition` (UPDATE guarded, idempotent, race-safe vs webhook)
   *  - HelloAsso ne retourne aucun payment ou un état non mappé → no-op
   *    (`outcome: still_pending`). L'admin peut ré-essayer plus tard ou annuler
   *    manuellement.
   *
   * Mapping HelloAsso state → status local : `mapHelloAssoState` (shared avec
   * le webhook receiver, single source of truth).
   *
   * Pas de check d'authz métier ici — le controller restreint déjà à
   * `ADMIN | ORGANISATEUR`. Un ORGANISATEUR peut refresh n'importe quel
   * paiement (scope large, identique à `listByCompetitionAdmin`).
   */
  async refreshStatusFromHelloAsso(paymentId: number): Promise<RefreshPaymentStatusDto> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Paiement #${paymentId} introuvable`);
    }
    if (payment.status !== HelloAssoPaymentStatus.PENDING) {
      this.logger.log(
        `refreshStatusFromHelloAsso: paymentId=${paymentId} already ${payment.status} (no-op)`,
      );
      return {
        id: payment.id,
        status: payment.status,
        paidAt: payment.paidAt,
        helloAssoState: null,
        outcome: 'no_change',
      };
    }
    if (!payment.helloAssoCheckoutIntentId) {
      throw new UnprocessableEntityException(
        `Paiement #${paymentId} sans helloAssoCheckoutIntentId — refresh impossible (rollback orphelin ?)`,
      );
    }

    const competition = await this.competitionRepo.findOne({
      where: { id: payment.competitionId },
    });
    if (!competition?.clubId) {
      throw new UnprocessableEntityException(
        `Compétition #${payment.competitionId} sans clubId — refresh impossible`,
      );
    }

    const details = await this.helloAssoDetails.findByClubId(competition.clubId);
    if (!details) {
      throw new UnprocessableEntityException(
        `Club ${competition.clubId} non lié à HelloAsso — refresh impossible`,
      );
    }

    const intentId = payment.helloAssoCheckoutIntentId;
    const data = await this.helloAssoDetails.withHelloAssoClubAccessToken(
      competition.clubId,
      accessToken =>
        this.helloAssoApi.getCheckoutIntent({
          organizationSlug: details.organizationSlug,
          accessToken,
          checkoutIntentId: intentId,
        }),
    );

    // Dernier payment côté HelloAsso : typiquement il n'y en a qu'un, mais HA
    // peut en empiler en cas de retry (cf. doc PaymentState). On prend le plus
    // récent qui mappe vers un statut terminal pour décider de la transition.
    const haPayments = data.order?.payments ?? [];
    const terminalPayment = [...haPayments]
      .reverse()
      .find(p => mapHelloAssoState(p.state) !== undefined);
    const helloAssoState =
      terminalPayment?.state ?? haPayments[haPayments.length - 1]?.state ?? null;
    const mappedStatus = mapHelloAssoState(helloAssoState ?? undefined);

    if (!mappedStatus || !terminalPayment) {
      this.logger.log(
        `refreshStatusFromHelloAsso: paymentId=${paymentId} HelloAsso state=${helloAssoState ?? '<none>'} → still pending`,
      );
      return {
        id: payment.id,
        status: payment.status,
        paidAt: payment.paidAt,
        helloAssoState,
        outcome: 'still_pending',
      };
    }

    const updated = await this.applyStatusTransition({
      payment,
      newStatus: mappedStatus,
      helloAssoPaymentId:
        typeof terminalPayment.id === 'number' ? terminalPayment.id : undefined,
      helloAssoOrderId: typeof data.order?.id === 'number' ? data.order.id : undefined,
    });

    const fresh = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!updated) {
      this.logger.log(
        `refreshStatusFromHelloAsso: paymentId=${paymentId} race-with-webhook, current=${fresh?.status ?? 'gone'}`,
      );
      return {
        id: payment.id,
        status: fresh?.status ?? payment.status,
        paidAt: fresh?.paidAt ?? payment.paidAt,
        helloAssoState,
        outcome: 'no_change',
      };
    }

    this.logger.log(
      `refreshStatusFromHelloAsso: paymentId=${paymentId} pending → ${mappedStatus}`,
    );
    return {
      id: payment.id,
      status: fresh?.status ?? mappedStatus,
      paidAt: fresh?.paidAt ?? null,
      helloAssoState,
      outcome: 'transitioned',
    };
  }

  /**
   * UPDATE atomique idempotent — duplique volontairement la logique de
   * `HelloAssoWebhookService.applyStatusTransition` pour découpler les deux
   * surfaces (webhook receiver vs action admin). Si les règles de transition
   * divergent un jour entre les deux chemins, on n'a pas à toucher l'autre.
   *
   *   pending → paid       (Authorized)
   *   pending → refused    (Refused/Error/Abandoned/Canceled)
   *   paid    → refunded   (Refunded)
   */
  private async applyStatusTransition(args: {
    payment: HelloAssoPaymentEntity;
    newStatus: HelloAssoPaymentStatus;
    helloAssoPaymentId: number | undefined;
    helloAssoOrderId: number | undefined;
  }): Promise<boolean> {
    const { payment, newStatus, helloAssoPaymentId, helloAssoOrderId } = args;

    const prerequisiteStatus =
      newStatus === HelloAssoPaymentStatus.REFUNDED
        ? HelloAssoPaymentStatus.PAID
        : HelloAssoPaymentStatus.PENDING;

    const update: Partial<HelloAssoPaymentEntity> = { status: newStatus };
    if (typeof helloAssoPaymentId === 'number') {
      update.helloAssoPaymentId = String(helloAssoPaymentId);
    }
    if (typeof helloAssoOrderId === 'number') {
      update.helloAssoOrderId = String(helloAssoOrderId);
    }
    if (newStatus === HelloAssoPaymentStatus.PAID) {
      update.paidAt = new Date();
    }

    const result = await this.paymentRepo
      .createQueryBuilder()
      .update(HelloAssoPaymentEntity)
      .set(update)
      .where('id = :id AND status = :prerequisite', {
        id: payment.id,
        prerequisite: prerequisiteStatus,
      })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Liste les paiements du user courant, avec filtres optionnels (compétition,
   * statut). 1 seule requête : LEFT JOIN sur `competition` pour récupérer
   * name/eventDate/fede d'un coup (évite N+1 côté app Dossardeur).
   *
   * **Broken Access Control safeguard** : `payerUserId` est TOUJOURS dans la
   * clause WHERE, jamais optionnel — un user ne peut voir QUE ses propres
   * paiements. Le caller (controller) doit lire `payerUserId` depuis
   * `@CurrentUser('id')` (JWT) et JAMAIS depuis une query string ou body.
   *
   * Usage côté Dossardeur :
   *  - Badge épreuve : `{ competitionId, status: 'pending' | 'paid' }` (filter en mémoire mobile)
   *  - Écran Mes paiements : `{}` (tous statuts, toutes compets)
   */
  async listForOwner(
    payerUserId: number,
    filters: { competitionId?: number; status?: HelloAssoPaymentStatus } = {},
  ): Promise<HelloAssoPaymentDto[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      // `leftJoinAndMapOne` injecte les entités jointes sur des propriétés
      // virtuelles (`payment.competition` / `payment.licence`, non dans
      // l'entité — d'où les casts côté mapping).
      .leftJoinAndMapOne(
        'payment.competition',
        CompetitionEntity,
        'competition',
        'competition.id = payment.competitionId',
      )
      .leftJoinAndMapOne(
        'payment.licence',
        LicenceEntity,
        'licence',
        'licence.id = payment.licenceId',
      )
      .where('payment.payerUserId = :payerUserId', { payerUserId });

    if (filters.competitionId !== undefined) {
      qb.andWhere('payment.competitionId = :competitionId', {
        competitionId: filters.competitionId,
      });
    }
    if (filters.status !== undefined) {
      qb.andWhere('payment.status = :status', { status: filters.status });
    }
    qb.orderBy('payment.createdAt', 'DESC');

    const payments = (await qb.getMany()) as Array<
      HelloAssoPaymentEntity & { competition?: CompetitionEntity; licence?: LicenceEntity }
    >;
    return payments.map(toPaymentListDto);
  }

  private findTarif(
    pricing: PricingInfo[] | null | undefined,
    tarifName: string,
  ): PricingInfo | undefined {
    if (!pricing || !Array.isArray(pricing)) return undefined;
    return pricing.find(p => p.name === tarifName);
  }

  private buildCheckoutBody(args: {
    payment: HelloAssoPaymentEntity;
    competition: CompetitionEntity;
    licence: LicenceEntity;
    tarif: PricingInfo;
    amountCents: number;
    payerProfile: { firstName: string; lastName: string; email: string };
  }): CheckoutIntentRequestBody {
    const { payment, competition, licence, tarif, amountCents, payerProfile } = args;
    const competitionName = competition.name ?? `Épreuve #${competition.id}`;
    // Inclut le nom+prénom du licencié dans le libellé HelloAsso pour faciliter
    // l'identification côté back-office orga (utile quand le payeur ≠ coureur,
    // ex. parent qui paie pour son enfant).
    const licenceFullName = [licence.firstName, licence.name].filter(Boolean).join(' ').trim();
    const itemSuffix = licenceFullName ? ` — ${licenceFullName}` : '';
    const itemName = truncate(`Inscription ${competitionName} — ${tarif.name}${itemSuffix}`, 250);
    // On append `paymentId=<id>` aux 3 URLs de retour pour que l'app puisse
    // mapper exactement le bon `competitionId` côté MMKV (`PaymentReturnRedirect`)
    // au lieu de prendre "le dernier pending" — robuste si plusieurs paiements
    // simultanés. HelloAsso préserve les query existantes et y append les
    // siennes (checkoutIntentId, code, orderId) → la query finale aura tout.
    return {
      totalAmount: amountCents,
      initialAmount: amountCents,
      itemName,
      backUrl: appendPaymentId(this.config.paymentReturnUrlCancelled, payment.id),
      errorUrl: appendPaymentId(this.config.paymentReturnUrlError, payment.id),
      returnUrl: appendPaymentId(this.config.paymentReturnUrlSuccess, payment.id),
      containsDonation: false,
      payer: payerProfile,
      metadata: {
        openDossardPaymentId: payment.id,
        competitionId: competition.id,
        competitionName,
        licenceId: licence.id,
        licenceNumber: licence.licenceNumber,
        tarifName: tarif.name,
      },
    };
  }
}
