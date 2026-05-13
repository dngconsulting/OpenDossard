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
import { HelloAssoApiClient, CheckoutIntentRequestBody } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
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
        `Le paiement en ligne n'est pas activé sur cette épreuve`,
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

    // 2. INSERT pending row (intent_id=NULL — sera renseigné après HelloAsso)
    // `tarif_id` est VARCHAR(64), on tronque le name au cas où.
    // Cette colonne sera retirée par une migration future (cf. design simplifié).
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
        tarifId: tarif.name.slice(0, 64),
        tarifLabelSnapshot: tarif.name,
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
    return this.toDto(payment);
  }

  /**
   * Liste les paiements actifs (`pending` ou `paid`) du user courant sur une
   * compétition donnée. Utilisé par l'app Dossardeur pour afficher le badge
   * "✓ Inscription payée" ou "⏳ Inscription en cours" sur l'écran épreuve.
   *
   * Filtre intentionnellement les statuts `refused` / `refunded` — ces états
   * ne correspondent pas à une inscription active et n'intéressent pas le
   * badge mobile. Si on a besoin de l'historique complet plus tard, on ajoutera
   * un query param `status` à l'endpoint.
   */
  async listActiveForOwnerByCompetition(
    competitionId: number,
    payerUserId: number,
  ): Promise<HelloAssoPaymentDto[]> {
    const payments = await this.paymentRepo.find({
      where: {
        competitionId,
        payerUserId,
        status: In([HelloAssoPaymentStatus.PENDING, HelloAssoPaymentStatus.PAID]),
      },
      order: { createdAt: 'DESC' },
    });
    return payments.map(toPaymentDto);
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
    const itemName = truncate(`Inscription ${competitionName} — ${tarif.name}`, 250);
    return {
      totalAmount: amountCents,
      initialAmount: amountCents,
      itemName,
      backUrl: this.config.paymentReturnUrlCancelled,
      errorUrl: this.config.paymentReturnUrlError,
      returnUrl: this.config.paymentReturnUrlSuccess,
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

  private toDto(payment: HelloAssoPaymentEntity): HelloAssoPaymentDto {
    return toPaymentDto(payment);
  }
}

function toPaymentDto(payment: HelloAssoPaymentEntity): HelloAssoPaymentDto {
  return {
    id: payment.id,
    status: payment.status,
    competitionId: payment.competitionId,
    licenceId: payment.licenceId,
    tarifName: payment.tarifLabelSnapshot,
    montant: payment.amountCents / 100,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * Parse la valeur de `tarif` (string | number) en euros.
 * Accepte `12,50` / `12.50` / `12,3` / `12` / number direct.
 * Renvoie `undefined` si vide, non parsable, ou ≤ 0.
 */
export function parseTarifAmount(tarif: string | number | undefined): number | undefined {
  if (typeof tarif === 'number') {
    return Number.isFinite(tarif) && tarif > 0 ? tarif : undefined;
  }
  if (typeof tarif !== 'string') return undefined;
  const cleaned = tarif.trim().replace(',', '.');
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
