import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { OrderDirection, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaymentAdminRowDto } from './dto/payment-admin-row.dto';
import { CompetitionPaymentDto } from './dto/competition-payment.dto';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import {
  applyAmountFilter,
  applyIlike,
  applyLicenceNameFilter,
  applyMultiValue,
  applyOrderBy,
  applyPayerNameFilter,
  mapRowToDto,
  RACE_CODE_SUBQUERY,
  RACE_RIDER_SUBQUERY,
  RawRow,
} from './helloasso-payments-admin.helpers';

/**
 * Aggregate par statut pour la grille admin : montant total + nombre de
 * paiements. Réagit aux filtres en cours (sauf pagination) — permet de voir
 * la recette des résultats actuellement filtrés.
 */
export interface PaymentsSummaryByStatus {
  paid: { amount: number; count: number };
  pending: { amount: number; count: number };
  refused: { amount: number; count: number };
  refunding: { amount: number; count: number };
  refunded: { amount: number; count: number };
}

/**
 * Réponse paginée enrichie avec `summary` (breakdown par statut). Étend
 * `PaginatedResponseDto` sans le modifier (cohérence avec les autres listes).
 */
export class PaymentsAdminListResponse extends PaginatedResponseDto<PaymentAdminRowDto> {
  summary: PaymentsSummaryByStatus;

  constructor(
    data: PaymentAdminRowDto[],
    total: number,
    offset: number,
    limit: number,
    summary: PaymentsSummaryByStatus,
  ) {
    super(data, total, offset, limit);
    this.summary = summary;
  }
}

/**
 * Service de lecture admin/organisateur des paiements HelloAsso.
 *
 * **Scope** : ces endpoints sont réservés ADMIN / ORGANISATEUR. La protection
 * est posée par les `@Roles()` du controller (`MOBILE` exclu). Ce service
 * n'applique aucune restriction par user — c'est intentionnel : la sécurité
 * est en amont (guard). Si un futur endpoint MOBILE doit utiliser ce service,
 * il faudra ajouter un filtre `payerUserId` ici.
 */
@Injectable()
export class HelloAssoPaymentsAdminService {
  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
  ) {}

  async list(filters: ListPaymentsAdminFilters): Promise<PaymentsAdminListResponse> {
    const { offset = 0, limit = 20 } = filters;
    const listQb = this.buildListQuery(filters);
    listQb.offset(offset).limit(limit);

    const summaryQb = this.buildSummaryQuery(filters);

    const [rawRows, total, summaryRows] = await Promise.all([
      listQb.getRawMany<RawRow>(),
      listQb.getCount(),
      summaryQb.getRawMany<SummaryRawRow>(),
    ]);

    const data = rawRows.map(mapRowToDto);
    const summary = aggregateSummary(summaryRows);

    return new PaymentsAdminListResponse(data, total, offset, limit, summary);
  }

  /**
   * Liste SLIM des paiements d'une compétition pour l'app mobile (onglet
   * "Inscrits").
   *
   * Différences clés avec `list()` :
   *  - SELECT restreint aux colonnes affichées (licence + tarif/montant + statut)
   *    — AUCUNE colonne payeur ni identifiant HelloAsso n'est rapatriée, donc
   *    rien de sensible ne peut fuiter même si le DTO évoluait ;
   *  - seuls les statuts `paid` et `pending` (engagements actifs) sont renvoyés ;
   *  - pas de pagination (one-shot, borné par `COMPETITION_PAYMENTS_MAX`) ni de
   *    filtres serveur — le filtrage se fait côté client (comme la grille
   *    classement) ;
   *  - tri par catégorie de valeur de la licence (`l.catev`), tie-breaker `p.id`.
   */
  async listCompetitionPayments(competitionId: number): Promise<CompetitionPaymentDto[]> {
    const rows = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('licence', 'l', 'l.id = p.licence_id')
      .select([
        'p.id           AS p_id',
        'p.status       AS p_status',
        'p.licence_id   AS p_licence_id',
        'p.tarif_id     AS p_tarif_id',
        'p.amount_cents AS p_amount_cents',
        'l.name         AS l_name',
        'l.first_name   AS l_first_name',
        'l.club         AS l_club',
        'l.gender       AS l_gender',
        'l.catea        AS l_catea',
        'l.catev        AS l_catev',
        'l.fede         AS l_fede',
      ])
      .andWhere('p.competition_id = :competitionId', { competitionId })
      .andWhere('p.status IN (:...statuses)', {
        statuses: [HelloAssoPaymentStatus.PAID, HelloAssoPaymentStatus.PENDING],
      })
      .orderBy('l.catev', 'ASC', 'NULLS LAST')
      .addOrderBy('p.id', 'ASC')
      .limit(COMPETITION_PAYMENTS_MAX)
      .getRawMany<CompetitionPaymentRawRow>();

    return rows.map(mapCompetitionPaymentRow);
  }

  /**
   * Query de liste : SELECT enrichi + WHERE + ORDER BY.
   * Race info via subqueries scalaires (pas de LEFT JOIN race) — l'index unique
   * race est sur `(competition_id, licence_id, race_code)`, donc une licence
   * engagée sur 2 raceCodes dupliquerait les lignes paiement avec un LEFT JOIN
   * naïf. Subqueries scalaires = 0 risque de duplication.
   */
  private buildListQuery(
    filters: ListPaymentsAdminFilters,
  ): SelectQueryBuilder<HelloAssoPaymentEntity> {
    const qb = this.baseQueryWithFilters(filters).select([
      'p.id              AS p_id',
      'p.status          AS p_status',
      'p.competition_id  AS p_competition_id',
      'p.licence_id      AS p_licence_id',
      'p.payer_user_id   AS p_payer_user_id',
      'p.payer_first_name AS p_payer_first_name',
      'p.payer_last_name  AS p_payer_last_name',
      'p.helloasso_checkout_intent_id AS p_checkout_intent_id',
      'p.helloasso_order_id           AS p_order_id',
      'p.helloasso_payment_id         AS p_payment_id',
      'p.tarif_id        AS p_tarif_id',
      'p.amount_cents    AS p_amount_cents',
      'p.paid_at         AS p_paid_at',
      'p.created_at      AS p_created_at',
      'c.name            AS c_name',
      'c.event_date      AS c_event_date',
      'l.name            AS l_name',
      'l.first_name      AS l_first_name',
      'l.club            AS l_club',
      'l.gender          AS l_gender',
      'l.dept            AS l_dept',
      'l.birth_year      AS l_birth_year',
      'l.catea           AS l_catea',
      'l.catev           AS l_catev',
      'l.fede            AS l_fede',
      `${RACE_RIDER_SUBQUERY} AS r_rider_number`,
      `${RACE_CODE_SUBQUERY}  AS r_race_code`,
      'u.first_name      AS u_first_name',
      'u.last_name       AS u_last_name',
    ]);

    applyOrderBy(qb, filters.orderBy, filters.orderDirection);
    return qb;
  }

  /**
   * Query d'agrégat pour le `summary` : applique les MÊMES filtres que la liste
   * (à part offset/limit) puis groupe par status. Permet à la SPA d'afficher
   * un total recette qui réagit aux filtres en cours (cf. design 2026-05-17).
   */
  private buildSummaryQuery(
    filters: ListPaymentsAdminFilters,
  ): SelectQueryBuilder<HelloAssoPaymentEntity> {
    return this.baseQueryWithFilters(filters)
      .select('p.status', 'status')
      .addSelect('COALESCE(SUM(p.amount_cents), 0)', 'amount_cents')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.status');
  }

  /**
   * Base partagée : FROM + JOINs nécessaires aux filtres (competition, licence,
   * user) + application des WHERE depuis `filters`. Pas de SELECT, pas de
   * ORDER BY — c'est aux callers de spécialiser.
   */
  private baseQueryWithFilters(
    filters: ListPaymentsAdminFilters,
  ): SelectQueryBuilder<HelloAssoPaymentEntity> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('competition', 'c', 'c.id = p.competition_id')
      .leftJoin('licence', 'l', 'l.id = p.licence_id')
      .leftJoin('user', 'u', 'u.id = p.payer_user_id');

    // Scope par compétition (route param côté controller)
    if (filters.competitionId !== undefined) {
      qb.andWhere('p.competition_id = :competitionId', { competitionId: filters.competitionId });
    }

    // Filtres colonnes
    applyIlike(qb, 'c.name', filters.competitionName);
    applyIlike(qb, "TO_CHAR(c.event_date, 'YYYY-MM-DD')", filters.competitionDate);
    applyIlike(qb, `CAST(${RACE_RIDER_SUBQUERY} AS TEXT)`, filters.riderNumber);
    applyLicenceNameFilter(qb, filters.licenceName);
    applyIlike(qb, 'l.club', filters.club);
    applyMultiValue(qb, 'l.gender', filters.gender);
    applyMultiValue(qb, 'l.dept', filters.dept);
    applyIlike(qb, 'l.birth_year', filters.birthYear);
    applyIlike(qb, 'l.catea', filters.catea);
    applyIlike(qb, 'l.catev', filters.catev);
    applyIlike(qb, 'CAST(l.fede AS TEXT)', filters.fede);
    applyPayerNameFilter(qb, filters.payerName);
    applyIlike(qb, 'p.helloasso_checkout_intent_id', filters.checkoutIntentId);
    applyIlike(qb, 'p.helloasso_order_id', filters.orderId);
    applyIlike(qb, 'p.helloasso_payment_id', filters.paymentId);
    if (filters.status !== undefined) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    applyIlike(qb, 'p.tarif_id', filters.tarifId);
    applyAmountFilter(qb, filters.amount);

    return qb;
  }
}

/** Borne de sécurité : aucune épreuve réelle n'a autant de paiements. */
const COMPETITION_PAYMENTS_MAX = 5000;

interface CompetitionPaymentRawRow {
  p_id: number;
  p_status: HelloAssoPaymentStatus;
  p_licence_id: number;
  p_tarif_id: string;
  p_amount_cents: number;
  l_name: string | null;
  l_first_name: string | null;
  l_club: string | null;
  l_gender: string | null;
  l_catea: string | null;
  l_catev: string | null;
  l_fede: string | null;
}

function mapCompetitionPaymentRow(row: CompetitionPaymentRawRow): CompetitionPaymentDto {
  return {
    id: row.p_id,
    status: row.p_status,
    licenceId: row.p_licence_id,
    licenceName: row.l_name,
    licenceFirstName: row.l_first_name,
    club: row.l_club,
    gender: row.l_gender,
    catea: row.l_catea,
    catev: row.l_catev,
    fede: row.l_fede,
    tarifId: row.p_tarif_id,
    amount: row.p_amount_cents / 100,
  };
}

interface SummaryRawRow {
  status: HelloAssoPaymentStatus;
  amount_cents: string | number;
  count: string | number;
}

function aggregateSummary(rows: SummaryRawRow[]): PaymentsSummaryByStatus {
  const init = { amount: 0, count: 0 };
  const out: PaymentsSummaryByStatus = {
    paid: { ...init },
    pending: { ...init },
    refused: { ...init },
    refunding: { ...init },
    refunded: { ...init },
  };
  for (const row of rows) {
    out[row.status] = {
      amount: Number(row.amount_cents) / 100,
      count: Number(row.count),
    };
  }
  return out;
}

export interface ListPaymentsAdminFilters {
  competitionId?: number;
  offset?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: OrderDirection;
  // Filtres colonnes
  competitionName?: string;
  competitionDate?: string;
  riderNumber?: string;
  licenceName?: string;
  club?: string;
  gender?: string;
  dept?: string;
  birthYear?: string;
  catea?: string;
  catev?: string;
  fede?: string;
  payerName?: string;
  checkoutIntentId?: string;
  orderId?: string;
  paymentId?: string;
  status?: HelloAssoPaymentStatus;
  tarifId?: string;
  amount?: string;
}
