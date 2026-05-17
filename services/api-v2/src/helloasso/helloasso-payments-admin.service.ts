import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { OrderDirection, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaymentAdminRowDto } from './dto/payment-admin-row.dto';
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
 * Service de lecture admin/organisateur des paiements HelloAsso.
 *
 * **Scope** : ces endpoints sont réservés ADMIN / ORGANISATEUR. La protection
 * est posée par les `@Roles()` du controller (`MOBILE` exclu). Ce service
 * n'applique aucune restriction par user — c'est intentionnel : la sécurité
 * est en amont (guard). Si un futur endpoint MOBILE doit utiliser ce service,
 * il faudra ajouter un filtre `payerUserId` ici.
 *
 * **Pourquoi un service séparé** : le service payeur (`helloasso-payment.service`)
 * gère le flow d'écriture (create / cancel) avec scope=me strict. Mélanger
 * des lectures admin élargies dans le même fichier mélange les modèles de
 * sécurité et fait grossir le fichier. Split = clair.
 */
@Injectable()
export class HelloAssoPaymentsAdminService {
  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
  ) {}

  async list(filters: ListPaymentsAdminFilters): Promise<PaginatedResponseDto<PaymentAdminRowDto>> {
    const { offset = 0, limit = 20 } = filters;
    const qb = this.buildQuery(filters);
    qb.offset(offset).limit(limit);

    const [rawRows, total] = await Promise.all([qb.getRawMany<RawRow>(), qb.getCount()]);
    const data = rawRows.map(mapRowToDto);

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  private buildQuery(
    filters: ListPaymentsAdminFilters,
  ): SelectQueryBuilder<HelloAssoPaymentEntity> {
    // Race info via subqueries scalaires (pas de LEFT JOIN race) — l'index
    // unique race est sur `(competition_id, licence_id, race_code)`, donc une
    // licence engagée sur 2 raceCodes dupliquerait les lignes paiement avec
    // un LEFT JOIN naïf. Subqueries scalaires = 0 risque de duplication.
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('competition', 'c', 'c.id = p.competition_id')
      .leftJoin('licence', 'l', 'l.id = p.licence_id')
      .leftJoin('user', 'u', 'u.id = p.payer_user_id')
      .select([
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

    // Scope par compétition (lu depuis route param côté controller)
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

    applyOrderBy(qb, filters.orderBy, filters.orderDirection);

    return qb;
  }
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
