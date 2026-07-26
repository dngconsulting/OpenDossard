import * as request from 'supertest';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';

const API = '/api/v2/dashboard';

describe('Dashboard (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  // ==================== GET /dashboard ====================

  describe('GET /dashboard (summary)', () => {
    it('should return dashboard summary with counters', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { stats: { totalLicenses: number; totalCompetitions: number } };
      expect(body).toHaveProperty('stats');
      expect(body.stats).toHaveProperty('totalLicenses');
      expect(body.stats).toHaveProperty('totalCompetitions');
      expect(typeof body.stats.totalLicenses).toBe('number');
      expect(typeof body.stats.totalCompetitions).toBe('number');
    });

    it('should return zeros on empty database', async () => {
      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { stats: { totalLicenses: number; totalCompetitions: number } };
      expect(body.stats.totalLicenses).toBe(0);
      expect(body.stats.totalCompetitions).toBe(0);
    });

    it('should allow ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);
    });

    it('should allow MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });
  });

  // ==================== GET /dashboard/stats ====================

  describe('GET /dashboard/stats', () => {
    it('should return detailed stats', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body;
      expect(body).toHaveProperty('totalCompetitions');
      expect(body).toHaveProperty('totalLicences');
      expect(body).toHaveProperty('totalRaces');
      expect(body).toHaveProperty('totalClubs');
      expect(body).toHaveProperty('competitionsByFederation');
      expect(body).toHaveProperty('competitionsByType');
    });

    it('should allow ORGANISATEUR role', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${orgaToken}`)
        .expect(200);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  // ==================== GET /dashboard/recent ====================

  describe('GET /dashboard/recent', () => {
    it('should return recent activity', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/recent`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        recentCompetitions: any[];
        recentRaces: any[];
      };
      expect(body).toHaveProperty('recentCompetitions');
      expect(body).toHaveProperty('recentRaces');
      expect(Array.isArray(body.recentCompetitions)).toBe(true);
      expect(Array.isArray(body.recentRaces)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/recent`)
        .query({ limit: 1 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { recentCompetitions: any[]; recentRaces: any[] };
      expect(body.recentCompetitions.length).toBeLessThanOrEqual(1);
      expect(body.recentRaces.length).toBeLessThanOrEqual(1);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/recent`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  // ==================== GET /dashboard/charts/* ====================

  describe('GET /dashboard/charts', () => {
    it.each([
      'riders-per-competition',
      'club-participation',
      'catea-distribution',
      'catev-distribution',
      'top-riders',
    ])('should allow MOBILE role on charts/%s', async chart => {
      await request(getApp().getHttpServer())
        .get(`${API}/charts/${chart}`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });

    it.each([
      'riders-per-competition',
      'club-participation',
      'catea-distribution',
      'catev-distribution',
      'top-riders',
    ])('should reject unauthenticated request on charts/%s', async chart => {
      await request(getApp().getHttpServer()).get(`${API}/charts/${chart}`).expect(401);
    });

    it('should return riders-per-competition chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/riders-per-competition`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as any[];
      expect(Array.isArray(body)).toBe(true);
    });

    it('should return club-participation chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/club-participation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return catea-distribution chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/catea-distribution`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return catev-distribution chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/catev-distribution`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return top-riders chart data', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/top-riders`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return chart data with correct structure when data exists', async () => {
      await getSeedHelper().seedFullDataset();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/charts/riders-per-competition`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { name: string; eventDate: string; count: number }[];
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('eventDate');
      expect(body[0]).toHaveProperty('count');

      // Cleanup
      await getSeedHelper().cleanRaces();
      await getSeedHelper().cleanCompetitions();
      await getSeedHelper().cleanLicences();
      await getSeedHelper().cleanClubs();
    });
  });

  // ============ GET /dashboard/charts/club-performances ============

  describe('GET /dashboard/charts/club-performances', () => {
    type Performance = {
      licenceId: number;
      name: string;
      firstName: string;
      catev: string | null;
      wins: number;
      seconds: number;
      thirds: number;
      sprintChallenges: number;
    };

    const CLUB = 'Vélo Club Toulousain';

    const get = (query: string, token = adminToken) =>
      request(getApp().getHttpServer())
        .get(`${API}/charts/club-performances${query}`)
        .set('Authorization', `Bearer ${token}`);

    const find = (body: Performance[], name: string, catev: string) =>
      body.find(p => p.name === name && p.catev === catev);

    describe('garde-fou du club', () => {
      it('should reject a request without any club', async () => {
        await get('').expect(400);
      });

      it('should reject a request with several clubs', async () => {
        await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT&clubs=AS%20Muret`).expect(400);
      });

      it('should reject a request without the club federation', async () => {
        // Un nom de club ne désigne pas un club : « CAHORS CYCLISME » existe en
        // UFOLEP, FFC et FFVELO au référentiel.
        await get(`?clubs=${encodeURIComponent(CLUB)}`).expect(400);
      });

      it('should reject an unknown federation', async () => {
        await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=NOT_A_FEDE`).expect(400);
      });

      it('should allow MOBILE role with a single club', async () => {
        await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`, mobileToken).expect(200);
      });

      it('should reject unauthenticated request', async () => {
        await request(getApp().getHttpServer())
          .get(`${API}/charts/club-performances?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`)
          .expect(401);
      });
    });

    describe('calcul des rangs', () => {
      beforeAll(async () => {
        await getSeedHelper().seedClubPerformancesDataset();
      });

      afterAll(async () => {
        await getSeedHelper().cleanRaces();
        await getSeedHelper().cleanCompetitions();
        await getSeedHelper().cleanLicences();
      });

      it('should count a win for a rider who is 5th scratch but 1st in category', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // GASSMANN est 5e au scratch du départ mixte (ranking_scratch = 2179,
        // magnitude corrompue) mais 1er des catégorie 2 : c'est une victoire.
        expect(find(body, 'GASSMANN', '2')).toMatchObject({ wins: 1, seconds: 0, thirds: 0 });
      });

      it('should count a second place in category', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        expect(find(body, 'JABER', '2')).toMatchObject({ wins: 0, seconds: 1, thirds: 0 });
      });

      it('should split a rider across the categories they raced in', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // Même licence, deux catégories, deux entrées d'une victoire chacune.
        expect(find(body, 'GASSMANN', '1')).toMatchObject({ wins: 1 });
        expect(body.filter(p => p.name === 'GASSMANN')).toHaveLength(2);
      });

      it('should exclude riders without any podium or sprint challenge', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // MARTY est 4e de sa catégorie : aucun compteur, donc absent.
        expect(body.some(p => p.name === 'MARTY')).toBe(false);
      });

      it('should ignore a sprint challenge won by an unranked rider', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // ROUX a abandonné : son challenge sprint ne doit pas être comptabilisé,
        // et il ne doit donc pas apparaître du tout.
        expect(body.some(p => p.name === 'ROUX')).toBe(false);
        expect(find(body, 'GASSMANN', '2')?.sprintChallenges).toBe(1);
      });

      it('should only return riders of the requested club', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        expect(body).toHaveLength(3);
        expect(body.every(p => ['GASSMANN', 'JABER'].includes(p.name))).toBe(true);
      });

      it('should restrict results to the requested date range', async () => {
        const res = await get(
          `?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT&startDate=2025-07-01&endDate=2025-12-31`,
        ).expect(200);
        const body = res.body as Performance[];

        // Seul le départ homogène du 20 juillet entre dans la fenêtre.
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ name: 'GASSMANN', catev: '1', wins: 1 });
      });

      it('should restrict results to the requested competition type', async () => {
        const res = await get(
          `?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT&competitionTypes=CX`,
        ).expect(200);

        expect(res.body).toEqual([]);
      });
    });

    // Régression : deux clubs de fédérations différentes peuvent porter le même
    // libellé (« CAHORS CYCLISME » existe en UFOLEP, FFC et FFVELO). `race.club`
    // étant du texte libre sans clé étrangère, le nom seul les agrégeait en un.
    describe('désambiguïsation des clubs homonymes', () => {
      beforeAll(async () => {
        await getSeedHelper().seedClubPerformancesDataset();
      });

      afterAll(async () => {
        await getSeedHelper().cleanRaces();
        await getSeedHelper().cleanCompetitions();
        await getSeedHelper().cleanLicences();
      });

      it('should exclude a rider licensed in another federation', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // OPENRIDER a gagné une épreuve FSGT sous le libellé du club, mais avec
        // une licence UFOLEP : le résultat n'appartient pas au club FSGT.
        expect(body.some(p => p.name === 'OPENRIDER')).toBe(false);
      });

      it('should exclude races organised by another federation', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=FSGT`).expect(200);
        const body = res.body as Performance[];

        // HOMONYME a gagné une épreuve UFOLEP : hors du périmètre du club FSGT.
        expect(body.some(p => p.name === 'HOMONYME')).toBe(false);
      });

      it('should return the homonymous club of another federation separately', async () => {
        const res = await get(`?clubs=${encodeURIComponent(CLUB)}&clubFede=UFOLEP`).expect(200);
        const body = res.body as Performance[];

        // Même libellé, autre fédération : on retrouve les deux licenciés UFOLEP
        // de l'épreuve UFOLEP (1er et 2e), et aucun coureur du club FSGT.
        expect(find(body, 'HOMONYME', '2')).toMatchObject({ wins: 1, seconds: 0 });
        expect(find(body, 'OPENRIDER', '2')).toMatchObject({ wins: 0, seconds: 1 });
        expect(body.some(p => ['GASSMANN', 'JABER'].includes(p.name))).toBe(false);
        expect(body).toHaveLength(2);
      });
    });
  });
});
