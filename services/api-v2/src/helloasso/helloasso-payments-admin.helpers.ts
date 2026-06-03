import { SelectQueryBuilder } from 'typeorm';

import { OrderDirection } from '../common/dto/pagination.dto';
import { PaymentAdminRowDto } from './dto/payment-admin-row.dto';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';

type QB = SelectQueryBuilder<HelloAssoPaymentEntity>;

/**
 * Subqueries scalaires pour récupérer le dossard et le raceCode d'un paiement
 * sans LEFT JOIN (qui dupliquerait les lignes pour les licences engagées sur
 * plusieurs raceCodes — unique sur `(competition_id, licence_id, race_code)`).
 *
 * Réutilisées dans SELECT (mapping DTO), ORDER BY (tri sur dossard), et WHERE
 * (filtre ILIKE sur dossard). LIMIT 1 + ORDER BY race_code rend la sélection
 * déterministe (1ère course alphanumérique du licencié).
 */
export const RACE_RIDER_SUBQUERY =
  '(SELECT race.rider_dossard FROM race WHERE race.competition_id = p.competition_id ' +
  'AND race.licence_id = p.licence_id ORDER BY race.race_code LIMIT 1)';

export const RACE_CODE_SUBQUERY =
  '(SELECT race.race_code FROM race WHERE race.competition_id = p.competition_id ' +
  'AND race.licence_id = p.licence_id ORDER BY race.race_code LIMIT 1)';

/**
 * Whitelist orderBy → expression SQL. Sécurité critique : tout `orderBy` hors
 * de cette map est ignoré (fallback default). Empêche SQL injection sur le
 * `orderBy` query param.
 */
export const ORDER_BY_MAP: Record<string, string> = {
  riderNumber: RACE_RIDER_SUBQUERY,
  licenceName: 'l.name',
  licenceFirstName: 'l.first_name',
  club: 'l.club',
  gender: 'l.gender',
  dept: 'l.dept',
  birthYear: 'l.birth_year',
  catea: 'l.catea',
  catev: 'l.catev',
  fede: 'l.fede',
  payerName: 'u.last_name',
  status: 'p.status',
  tarifId: 'p.tarif_id',
  amount: 'p.amount_cents',
  createdAt: 'p.created_at',
  paidAt: 'p.paid_at',
  competitionName: 'c.name',
  competitionDate: 'c.event_date',
};

export function applyOrderBy(
  qb: QB,
  orderBy: string | undefined,
  direction: OrderDirection | undefined,
): void {
  const sqlExpr = orderBy ? ORDER_BY_MAP[orderBy] : undefined;
  const dir: 'ASC' | 'DESC' = direction === OrderDirection.ASC ? 'ASC' : 'DESC';

  if (sqlExpr) {
    qb.orderBy(sqlExpr, dir, 'NULLS LAST');
    // Tie-breaker stable : sur égalité, plus récent en haut.
    qb.addOrderBy('p.created_at', 'DESC');
  } else {
    // Default : paiements payés récents en haut, puis pending/refused récents.
    qb.orderBy('p.paid_at', 'DESC', 'NULLS LAST');
    qb.addOrderBy('p.created_at', 'DESC');
  }
  // Tie-breaker final sur la clé primaire (unique, non-null) : garantit un ordre
  // total déterministe, donc une pagination offset sans doublon/manquant en
  // frontière de page — y compris si `created_at` collisionne (insert groupé).
  qb.addOrderBy('p.id', 'ASC');
}

/**
 * Sentinel envoyé par le bouton "Filtrer les valeurs vides" du `DataTable`
 * (cf. data-table.tsx `handleFilterChange(columnId, '__empty__')`). Doit
 * être interprété comme `IS NULL OR = ''` côté SQL, pas comme une recherche
 * littérale de la chaîne `__empty__`.
 */
const FILTER_EMPTY_SENTINEL = '__empty__';

export function applyIlike(qb: QB, expression: string, value: string | undefined): void {
  if (!value) return;
  if (value === FILTER_EMPTY_SENTINEL) {
    qb.andWhere(`(${expression} IS NULL OR ${expression} = '')`);
    return;
  }
  // Param name unique pour éviter collisions entre appels successifs sur le
  // même qb (TypeORM merge les params nommés). On hash l'expression.
  const param = `flt_${Math.abs(hashString(expression))}`;
  qb.andWhere(`${expression} ILIKE :${param}`, { [param]: `%${value}%` });
}

export function applyMultiValue(qb: QB, column: string, value: string | undefined): void {
  if (!value) return;
  if (value.includes(',')) {
    const values = value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    const param = `flt_in_${Math.abs(hashString(column))}`;
    qb.andWhere(`${column} IN (:...${param})`, { [param]: values });
  } else {
    applyIlike(qb, column, value);
  }
}

export function applyLicenceNameFilter(qb: QB, value: string | undefined): void {
  if (!value) return;
  qb.andWhere('(l.name ILIKE :licenceName OR l.first_name ILIKE :licenceName)', {
    licenceName: `%${value}%`,
  });
}

export function applyPayerNameFilter(qb: QB, value: string | undefined): void {
  if (!value) return;
  qb.andWhere(
    '(u.first_name ILIKE :payerName OR u.last_name ILIKE :payerName ' +
      'OR p.payer_first_name ILIKE :payerName OR p.payer_last_name ILIKE :payerName)',
    { payerName: `%${value}%` },
  );
}

export function applyAmountFilter(qb: QB, value: string | undefined): void {
  if (!value) return;
  // Recherche libre : on convertit en cents pour matcher, sinon ILIKE sur la
  // représentation décimale.
  const cleaned = value.trim().replace(',', '.');
  const asNumber = Number(cleaned);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const cents = Math.round(asNumber * 100);
    qb.andWhere('p.amount_cents = :amountCents', { amountCents: cents });
  } else {
    qb.andWhere('CAST(p.amount_cents AS TEXT) ILIKE :amountLike', {
      amountLike: `%${value.replace(/[^\d]/g, '')}%`,
    });
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// --- Raw row mapping ---

export interface RawRow {
  p_id: number;
  p_status: HelloAssoPaymentStatus;
  p_competition_id: number;
  p_licence_id: number;
  p_payer_user_id: number | null;
  p_payer_first_name: string | null;
  p_payer_last_name: string | null;
  p_checkout_intent_id: string | null;
  p_order_id: string | null;
  p_payment_id: string | null;
  p_tarif_id: string;
  p_amount_cents: number;
  p_paid_at: Date | null;
  p_created_at: Date;
  c_name: string | null;
  c_event_date: Date | null;
  l_name: string | null;
  l_first_name: string | null;
  l_club: string | null;
  l_gender: string | null;
  l_dept: string | null;
  l_birth_year: string | null;
  l_catea: string | null;
  l_catev: string | null;
  l_fede: string | null;
  r_rider_number: number | null;
  r_race_code: string | null;
  u_first_name: string | null;
  u_last_name: string | null;
}

export function mapRowToDto(row: RawRow): PaymentAdminRowDto {
  return {
    id: row.p_id,
    status: row.p_status,
    competitionId: row.p_competition_id,
    competitionName: row.c_name,
    competitionDate: row.c_event_date?.toISOString() ?? null,
    licenceId: row.p_licence_id,
    licenceName: row.l_name,
    licenceFirstName: row.l_first_name,
    club: row.l_club,
    gender: row.l_gender,
    dept: row.l_dept,
    birthYear: row.l_birth_year,
    catea: row.l_catea,
    catev: row.l_catev,
    fede: row.l_fede,
    riderNumber: row.r_rider_number,
    raceCode: row.r_race_code,
    payerUserId: row.p_payer_user_id,
    // Préférence : user.first_name (frais) sur snapshot (`p.payer_first_name`)
    // — sauf si user supprimé RGPD (payer_user_id NULL), on retombe sur snapshot.
    payerFirstName: row.u_first_name ?? row.p_payer_first_name,
    payerLastName: row.u_last_name ?? row.p_payer_last_name,
    checkoutIntentId: row.p_checkout_intent_id,
    orderId: row.p_order_id,
    paymentId: row.p_payment_id,
    tarifId: row.p_tarif_id,
    amount: row.p_amount_cents / 100,
    createdAt: row.p_created_at.toISOString(),
    paidAt: row.p_paid_at?.toISOString() ?? null,
  };
}
