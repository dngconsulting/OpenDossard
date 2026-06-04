import { Repository } from 'typeorm';

import { OrderDirection } from '../common/dto/pagination.dto';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoPaymentsAdminService } from './helloasso-payments-admin.service';

interface QbMock {
  leftJoin: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  offset: jest.Mock;
  limit: jest.Mock;
  getRawMany: jest.Mock;
  getCount: jest.Mock;
  // captures pour assertions
  whereCalls: Array<{ sql: string; params?: Record<string, unknown> }>;
  orderByCalls: Array<{ sql: string; dir: string; nulls?: string }>;
  addOrderByCalls: Array<{ sql: string; dir: string }>;
  paginationCalls: { offset?: number; limit?: number };
}

function makeQbMock(rawRows: unknown[] = [], count = 0): QbMock {
  const qb = {
    whereCalls: [] as QbMock['whereCalls'],
    orderByCalls: [] as QbMock['orderByCalls'],
    addOrderByCalls: [] as QbMock['addOrderByCalls'],
    paginationCalls: {} as QbMock['paginationCalls'],
  } as QbMock;

  qb.leftJoin = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.groupBy = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockImplementation((sql: string, params?: Record<string, unknown>) => {
    qb.whereCalls.push({ sql, params });
    return qb;
  });
  qb.orderBy = jest.fn().mockImplementation((sql: string, dir: string, nulls?: string) => {
    qb.orderByCalls.push({ sql, dir, nulls });
    return qb;
  });
  qb.addOrderBy = jest.fn().mockImplementation((sql: string, dir: string) => {
    qb.addOrderByCalls.push({ sql, dir });
    return qb;
  });
  qb.offset = jest.fn().mockImplementation((n: number) => {
    qb.paginationCalls.offset = n;
    return qb;
  });
  qb.limit = jest.fn().mockImplementation((n: number) => {
    qb.paginationCalls.limit = n;
    return qb;
  });
  qb.getRawMany = jest.fn().mockResolvedValue(rawRows);
  qb.getCount = jest.fn().mockResolvedValue(count);

  return qb;
}

function makeService(qb: QbMock): HelloAssoPaymentsAdminService {
  const repo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as Repository<HelloAssoPaymentEntity>;

  return new HelloAssoPaymentsAdminService(repo);
}

function makeRawRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const baseDate = new Date('2026-05-17T10:00:00Z');
  return {
    p_id: 1,
    p_status: HelloAssoPaymentStatus.PAID,
    p_competition_id: 32,
    p_licence_id: 1234,
    p_payer_user_id: 50,
    p_payer_first_name: 'Sami',
    p_payer_last_name: 'Jaber',
    p_checkout_intent_id: 'ci_1',
    p_order_id: 'order_1',
    p_payment_id: 'pay_1',
    p_tarif_id: 'Adulte',
    p_amount_cents: 1250,
    p_paid_at: baseDate,
    p_created_at: baseDate,
    c_name: 'Critérium FSGT',
    c_event_date: baseDate,
    l_name: 'Dupont',
    l_first_name: 'Jean',
    l_club: 'CC Castanet',
    l_gender: 'H',
    l_dept: '31',
    l_birth_year: '1990',
    l_catea: 'SE',
    l_catev: '3',
    l_fede: 'FSGT',
    r_rider_number: 42,
    r_race_code: '3/4',
    u_first_name: 'Sami',
    u_last_name: 'Jaber',
    ...overrides,
  };
}

describe('HelloAssoPaymentsAdminService', () => {
  describe('list', () => {
    it('applies default sort: paid_at DESC NULLS LAST, then created_at DESC, then id ASC', async () => {
      const qb = makeQbMock([], 0);
      const service = makeService(qb);
      await service.list({});

      expect(qb.orderByCalls).toHaveLength(1);
      expect(qb.orderByCalls[0]).toEqual({ sql: 'p.paid_at', dir: 'DESC', nulls: 'NULLS LAST' });
      // created_at DESC puis tie-breaker final déterministe sur la PK (p.id ASC).
      expect(qb.addOrderByCalls).toHaveLength(2);
      expect(qb.addOrderByCalls[0]).toEqual({ sql: 'p.created_at', dir: 'DESC' });
      expect(qb.addOrderByCalls[1]).toEqual({ sql: 'p.id', dir: 'ASC' });
    });

    it('falls back to default sort when orderBy is not whitelisted (anti-SQL injection)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ orderBy: "name'; DROP TABLE--", orderDirection: OrderDirection.ASC });

      expect(qb.orderByCalls[0].sql).toBe('p.paid_at');
      expect(qb.orderByCalls[0].dir).toBe('DESC');
    });

    it('honors whitelisted orderBy (column + direction)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ orderBy: 'amount', orderDirection: OrderDirection.ASC });

      expect(qb.orderByCalls[0]).toEqual({
        sql: 'p.amount_cents',
        dir: 'ASC',
        nulls: 'NULLS LAST',
      });
      // Tie-breakers : created_at DESC puis PK déterministe p.id ASC.
      expect(qb.addOrderByCalls[0]).toEqual({ sql: 'p.created_at', dir: 'DESC' });
      expect(qb.addOrderByCalls[1]).toEqual({ sql: 'p.id', dir: 'ASC' });
    });

    it('applies competitionId scope WHERE', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ competitionId: 32 });

      const hit = qb.whereCalls.find(c => c.sql.includes('p.competition_id'));
      expect(hit).toBeDefined();
      expect(hit?.params).toEqual({ competitionId: 32 });
    });

    it('does NOT add competitionId WHERE when undefined (scope=all)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({});

      const hit = qb.whereCalls.find(c => c.sql.includes('p.competition_id'));
      expect(hit).toBeUndefined();
    });

    it('applies ILIKE filter on club', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ club: 'Castanet' });

      const hit = qb.whereCalls.find(c => c.sql.includes('l.club ILIKE'));
      expect(hit).toBeDefined();
      const paramValue = Object.values(hit?.params ?? {})[0];
      expect(paramValue).toBe('%Castanet%');
    });

    it('applies multi-value IN filter on dept when comma-separated', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ dept: '31,33' });

      const hit = qb.whereCalls.find(c => c.sql.includes('l.dept IN'));
      expect(hit).toBeDefined();
      const param = Object.values(hit?.params ?? {})[0];
      expect(param).toEqual(['31', '33']);
    });

    it('applies licenceName filter on name OR first_name (composite)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ licenceName: 'Dupont' });

      const hit = qb.whereCalls.find(
        c => c.sql.includes('l.name ILIKE') && c.sql.includes('l.first_name ILIKE'),
      );
      expect(hit).toBeDefined();
      expect(hit?.params).toEqual({ licenceName: '%Dupont%' });
    });

    it('applies payerName filter on user + snapshot columns', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ payerName: 'Sami' });

      const hit = qb.whereCalls.find(
        c => c.sql.includes('u.first_name ILIKE') && c.sql.includes('p.payer_first_name ILIKE'),
      );
      expect(hit).toBeDefined();
      expect(hit?.params).toEqual({ payerName: '%Sami%' });
    });

    it('applies exact match on amount when value is a valid number', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ amount: '12,50' });

      const hit = qb.whereCalls.find(c => c.sql.includes('p.amount_cents ='));
      expect(hit).toBeDefined();
      expect(hit?.params).toEqual({ amountCents: 1250 });
    });

    it('applies status filter with exact enum match', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ status: HelloAssoPaymentStatus.PAID });

      const hit = qb.whereCalls.find(c => c.sql.includes('p.status'));
      expect(hit).toBeDefined();
      expect(hit?.params).toEqual({ status: HelloAssoPaymentStatus.PAID });
    });

    it('does NOT add any filter clause when no filter is provided', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({});

      // Aucun andWhere : pagination/order ne passent pas par andWhere.
      expect(qb.whereCalls).toHaveLength(0);
    });

    it('applies pagination offset/limit with defaults (0, 20)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({});

      expect(qb.paginationCalls).toEqual({ offset: 0, limit: 20 });
    });

    it('honors custom offset/limit', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({ offset: 40, limit: 10 });

      expect(qb.paginationCalls).toEqual({ offset: 40, limit: 10 });
    });

    it('maps raw row → PaymentAdminRowDto correctly (joined columns)', async () => {
      const qb = makeQbMock([makeRawRow()], 1);
      const service = makeService(qb);
      const res = await service.list({});

      expect(res.data).toHaveLength(1);
      expect(res.data[0]).toMatchObject({
        id: 1,
        status: HelloAssoPaymentStatus.PAID,
        competitionId: 32,
        competitionName: 'Critérium FSGT',
        licenceId: 1234,
        licenceName: 'Dupont',
        licenceFirstName: 'Jean',
        club: 'CC Castanet',
        gender: 'H',
        dept: '31',
        riderNumber: 42,
        raceCode: '3/4',
        payerUserId: 50,
        payerFirstName: 'Sami',
        payerLastName: 'Jaber',
        checkoutIntentId: 'ci_1',
        orderId: 'order_1',
        paymentId: 'pay_1',
        tarifId: 'Adulte',
        amount: 12.5,
      });
      expect(res.data[0].createdAt).toBe('2026-05-17T10:00:00.000Z');
      expect(res.data[0].paidAt).toBe('2026-05-17T10:00:00.000Z');
    });

    it('falls back to snapshot payerFirstName/Last when payer_user_id is NULL (RGPD)', async () => {
      const qb = makeQbMock([
        makeRawRow({
          p_payer_user_id: null,
          u_first_name: null,
          u_last_name: null,
          p_payer_first_name: 'Anon',
          p_payer_last_name: 'Snapshot',
        }),
      ]);
      const service = makeService(qb);
      const res = await service.list({});

      expect(res.data[0].payerUserId).toBeNull();
      expect(res.data[0].payerFirstName).toBe('Anon');
      expect(res.data[0].payerLastName).toBe('Snapshot');
    });

    it('returns NULL race fields when payment has no matching race', async () => {
      const qb = makeQbMock([makeRawRow({ r_rider_number: null, r_race_code: null })]);
      const service = makeService(qb);
      const res = await service.list({});

      expect(res.data[0].riderNumber).toBeNull();
      expect(res.data[0].raceCode).toBeNull();
    });

    it('returns paginated meta with total count', async () => {
      const qb = makeQbMock([makeRawRow()], 137);
      const service = makeService(qb);
      const res = await service.list({ offset: 20, limit: 20 });

      expect(res.meta).toEqual({ offset: 20, limit: 20, total: 137, hasMore: true });
    });

    it('does NOT LEFT JOIN race (avoids row duplication when licence is on N raceCodes)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({});

      // L'index unique race est sur `(competition_id, licence_id, race_code)` :
      // une licence engagée sur 2 raceCodes différents dans la même compétition
      // dupliquerait les lignes paiement via un LEFT JOIN naïf. On utilise donc
      // des subqueries scalaires SELECT-only, pas de JOIN race.
      const raceJoin = (qb.leftJoin.mock.calls as unknown[][]).find(call => call[0] === 'race');
      expect(raceJoin).toBeUndefined();
    });

    it('uses scalar subquery for rider_dossard in SELECT (sortable, single-row)', async () => {
      const qb = makeQbMock();
      const service = makeService(qb);
      await service.list({});

      const selectCall = qb.select.mock.calls[0] as unknown[];
      const cols = selectCall[0] as string[];
      const riderCol = cols.find(c => c.includes('r_rider_number'));
      expect(riderCol).toBeDefined();
      expect(riderCol).toMatch(/SELECT race\.rider_dossard FROM race/);
      expect(riderCol).toMatch(/ORDER BY race\.race_code LIMIT 1/);
    });
  });

  describe('listCompetitionPayments (vue SLIM mobile)', () => {
    it('SELECT slim sans aucune colonne sensible (payeur / transaction HelloAsso)', async () => {
      const qb = makeQbMock([]);
      const service = makeService(qb);
      await service.listCompetitionPayments(32);

      const selectCall = qb.select.mock.calls[0] as unknown[];
      const cols = selectCall[0] as string[];
      const joined = cols.join(' ').toLowerCase();
      expect(joined).not.toContain('payer');
      expect(joined).not.toContain('checkout_intent');
      expect(joined).not.toContain('order_id');
      expect(joined).not.toContain('payment_id');
      expect(joined).not.toContain('helloasso');
      expect(joined).toContain('l.catev');
    });

    it('ne renvoie que les statuts paid + pending, scopé compétition', async () => {
      const qb = makeQbMock([]);
      const service = makeService(qb);
      await service.listCompetitionPayments(32);

      const statusWhere = qb.whereCalls.find(w => /status IN/i.test(w.sql));
      expect(statusWhere?.params?.statuses).toEqual(['paid', 'pending']);
      expect(qb.whereCalls.some(w => /p\.competition_id = :competitionId/.test(w.sql))).toBe(true);
    });

    it('trie par catégorie de licence (l.catev) puis tie-breaker p.id, borné à 5000', async () => {
      const qb = makeQbMock([]);
      const service = makeService(qb);
      await service.listCompetitionPayments(32);

      expect(qb.orderByCalls[0]).toEqual({ sql: 'l.catev', dir: 'ASC', nulls: 'NULLS LAST' });
      expect(qb.addOrderByCalls[0]).toEqual({ sql: 'p.id', dir: 'ASC' });
      expect(qb.paginationCalls.limit).toBe(5000);
    });

    it('mappe la ligne SLIM (montant en euros, colonnes licence)', async () => {
      const qb = makeQbMock([makeRawRow()]);
      const service = makeService(qb);
      const res = await service.listCompetitionPayments(32);

      expect(res).toEqual([
        {
          id: 1,
          status: 'paid',
          licenceId: 1234,
          licenceName: 'Dupont',
          licenceFirstName: 'Jean',
          club: 'CC Castanet',
          gender: 'H',
          catea: 'SE',
          catev: '3',
          fede: 'FSGT',
          tarifId: 'Adulte',
          amount: 12.5,
        },
      ]);
    });
  });
});
