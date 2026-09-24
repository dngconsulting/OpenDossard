import * as request from 'supertest';

import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { LicenceEntity } from '../src/licences/entities/licence.entity';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; offset: number; limit: number; hasMore: boolean };
}

const API = '/api/v2/licences';

describe('Licences (e2e)', () => {
  let adminToken: string;
  let orgaToken: string;
  let mobileToken: string;

  beforeAll(() => {
    adminToken = getAuthHelper().getAdminToken();
    orgaToken = getAuthHelper().getOrgaToken();
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanLicences();
  });

  describe('GET /licences (pagination & filters)', () => {
    it('should return paginated licences', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(3);
      expect(body.meta.total).toBe(3);
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('limit');
    });

    it('should respect offset and limit', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ offset: 0, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.hasMore).toBe(true);
    });

    it('should filter by name column', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ name: 'DUPONT' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('DUPONT');
    });

    it('should filter by dept', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ dept: '31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dept).toBe('31');
    });

    it('should filter by fede', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ fede: 'FFC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].fede).toBe('FFC');
    });

    it('should filter by global search', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ search: 'DUPONT' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('DUPONT');
    });

    describe('compound name search (#268)', () => {
      beforeEach(async () => {
        await getSeedHelper().seedCompoundNameLicences();
      });

      it('should find "DE MARCHI" with multi-word search "DE MARCHI"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'DE MARCHI' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DE MARCHI');
      });

      it('should find "DE MARCHI" with compact search "DEMARCHI"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'DEMARCHI' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DE MARCHI');
      });

      it('should find "DA SILVA" with multi-word search "DA SILVA"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'DA SILVA' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DA SILVA');
      });

      it('should find "DA SILVA" with compact search "DASILVA"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'DASILVA' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DA SILVA');
      });

      it('should find "DE MARCHI" with firstName+name search "Victor DE"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'Victor DE' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DE MARCHI');
      });

      it('should find "DE MARCHI" with compact+firstName search "demarchi victor"', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'demarchi victor' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DE MARCHI');
      });

      it('should be case-insensitive for compound names', async () => {
        const res = await request(getApp().getHttpServer())
          .get(API)
          .query({ search: 'de marchi' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = res.body as PaginatedResponse<LicenceEntity>;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].name).toBe('DE MARCHI');
      });
    });

    it('should sort by name DESC', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(API)
        .query({ orderBy: 'name', orderDirection: 'DESC' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as PaginatedResponse<LicenceEntity>;
      const names = body.data.map(l => l.name);
      expect(names).toEqual(['MARTIN', 'GARCÍA', 'DUPONT']);
    });

    it('should reject unauthenticated request', async () => {
      await request(getApp().getHttpServer()).get(API).expect(401);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .get(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(403);
    });
  });

  describe('GET /licences/search', () => {
    it('should return matching licences by name prefix', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: 'DUP' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('DUPONT');
    });

    it('should return matching licences by licence number', async () => {
      await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: '12345' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity[];
      expect(body).toHaveLength(1);
      expect(body[0].licenceNumber).toBe('12345678');
    });

    it('should allow MOBILE role', async () => {
      await getSeedHelper().seedLicences();

      await request(getApp().getHttpServer())
        .get(`${API}/search`)
        .query({ q: 'DUPONT' })
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });
  });

  describe('GET /licences/:id', () => {
    it('should return a single licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.name).toBe('DUPONT');
      expect(body.firstName).toBe('Jean');
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .get(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should allow MOBILE role', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${mobileToken}`)
        .expect(200);
    });
  });

  describe('POST /licences', () => {
    it('should create a licence as ADMIN', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'LEROY',
          firstName: 'Lucas',
          gender: 'H',
          birthYear: '2000',
          dept: '75',
          fede: 'FSGT',
          catea: 'E',
          saison: '2025',
        })
        .expect(201);

      const body = res.body as LicenceEntity;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('LEROY');
      expect(body.author).toBe('admin@test.com');
    });

    it('should create a licence as ORGANISATEUR', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${orgaToken}`)
        .send({
          name: 'PETIT',
          firstName: 'Julie',
          gender: 'F',
          birthYear: '1995',
          dept: '31',
          fede: 'FSGT',
          catea: 'FS',
          saison: '2025',
        })
        .expect(201);
    });

    it('should reject MOBILE role', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          name: 'X',
          firstName: 'X',
          gender: 'H',
          birthYear: '2000',
          dept: '75',
          fede: 'FSGT',
          catea: 'S',
          saison: '2025',
        })
        .expect(403);
    });

    it('should reject invalid payload (missing required fields)', async () => {
      await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ONLY_NAME' })
        .expect(400);
    });
  });

  describe('PATCH /licences/:id', () => {
    it('should update a licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catev: '1' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.catev).toBe('1');
      expect(body.author).toBe('admin@test.com');
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .patch(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catev: '1' })
        .expect(404);
    });
  });

  // Un non-licencié (NL) ne porte ni numéro de licence ni club. Avant cette
  // règle, basculer une licence FSGT → NL conservait en base le numéro et le
  // club de la fédé précédente (le formulaire masque ces champs mais renvoie
  // l'ancien numéro, et n'envoie rien pour le club, que le PATCH laissait donc
  // intact). Le département, lui, reste obligatoire pour un NL.
  describe('règle NL : ni numéro de licence ni club', () => {
    async function readFromDb(
      id: number,
    ): Promise<Pick<LicenceEntity, 'licenceNumber' | 'club' | 'dept'>> {
      return getApp()
        .get(DataSource)
        .getRepository(LicenceEntity)
        .findOneOrFail({ where: { id }, select: ['licenceNumber', 'club', 'dept'] });
    }

    it('PATCH FSGT → NL remet licenceNumber et club à NULL, conserve dept', async () => {
      const [licence] = await getSeedHelper().seedLicences();
      expect(licence.licenceNumber).toBe('12345678');
      expect(licence.club).toBe('Vélo Club Toulousain');

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'NL' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.fede).toBe('NL');
      expect(body.licenceNumber).toBeNull();
      expect(body.club).toBeNull();
      expect(body.dept).toBe('31');
      expect(await readFromDb(licence.id)).toEqual({ licenceNumber: null, club: null, dept: '31' });
    });

    it('PATCH vers NL ignore un numéro et un club envoyés dans le payload', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'NL', licenceNumber: '12345678', club: 'Vélo Club Toulousain' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.licenceNumber).toBeNull();
      expect(body.club).toBeNull();
    });

    it('PATCH d’une licence déjà NL ne réintroduit ni numéro ni club', async () => {
      const [licence] = await getSeedHelper().seedLicences();
      await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'NL' })
        .expect(200);

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ licenceNumber: '99999999', club: 'Club fantôme' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.licenceNumber).toBeNull();
      expect(body.club).toBeNull();
    });

    it('PATCH vers une autre fédé (FSGT → UFOLEP) conserve numéro et club', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'UFOLEP' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.licenceNumber).toBe('12345678');
      expect(body.club).toBe('Vélo Club Toulousain');
    });

    it('POST d’une licence NL avec numéro et club les persiste à NULL', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SANSCLUB',
          firstName: 'Nina',
          gender: 'F',
          birthYear: '1995',
          dept: '81',
          fede: 'NL',
          club: 'Club hérité',
          licenceNumber: '55555555',
          catea: 'S',
          saison: '2025',
        })
        .expect(201);

      const body = res.body as LicenceEntity;
      expect(body.fede).toBe('NL');
      expect(body.licenceNumber).toBeNull();
      expect(body.club).toBeNull();
      expect(body.dept).toBe('81');
      expect(await readFromDb(body.id)).toEqual({ licenceNumber: null, club: null, dept: '81' });
    });
  });

  // Les catégories de valeur (route et CX) sont réglementées par une fédé :
  // elles n'ont pas de sens pour un NL. La catégorie d'âge, elle, est conservée.
  describe('règle NL : ni catégorie de valeur ni catégorie CX', () => {
    async function readCategoriesFromDb(
      id: number,
    ): Promise<Pick<LicenceEntity, 'catea' | 'catev' | 'catevCX'>> {
      return getApp()
        .get(DataSource)
        .getRepository(LicenceEntity)
        .findOneOrFail({ where: { id }, select: ['catea', 'catev', 'catevCX'] });
    }

    it('PATCH FSGT → NL remet catev et catevCX à NULL, conserve catea', async () => {
      const [licence] = await getSeedHelper().seedLicences();
      await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catevCX: '2' })
        .expect(200);

      const res = await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'NL' })
        .expect(200);

      const body = res.body as LicenceEntity;
      expect(body.catev).toBeNull();
      expect(body.catevCX).toBeNull();
      expect(await readCategoriesFromDb(licence.id)).toEqual({
        catea: 'S',
        catev: null,
        catevCX: null,
      });
    });

    it('PATCH d’une licence déjà NL ne réintroduit pas de catégorie', async () => {
      const [licence] = await getSeedHelper().seedLicences();
      await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fede: 'NL' })
        .expect(200);

      await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catev: '1', catevCX: '1' })
        .expect(200);

      expect(await readCategoriesFromDb(licence.id)).toEqual({
        catea: 'S',
        catev: null,
        catevCX: null,
      });
    });

    it('POST d’une licence NL avec catégories les persiste à NULL, conserve catea', async () => {
      const res = await request(getApp().getHttpServer())
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SANSCATE',
          firstName: 'Noé',
          gender: 'H',
          birthYear: '1990',
          dept: '31',
          fede: 'NL',
          catea: 'S',
          catev: '3',
          catevCX: '2',
          saison: '2025',
        })
        .expect(201);

      expect(await readCategoriesFromDb((res.body as LicenceEntity).id)).toEqual({
        catea: 'S',
        catev: null,
        catevCX: null,
      });
    });

    it('PATCH d’une licence FSGT conserve ses catégories', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      await request(getApp().getHttpServer())
        .patch(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catevCX: '2' })
        .expect(200);

      expect(await readCategoriesFromDb(licence.id)).toEqual({
        catea: 'S',
        catev: '2',
        catevCX: '2',
      });
    });
  });

  describe('DELETE /licences/:id', () => {
    it('should delete a licence', async () => {
      const [licence] = await getSeedHelper().seedLicences();

      const res = await request(getApp().getHttpServer())
        .delete(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect((res.body as { success: boolean }).success).toBe(true);

      await request(getApp().getHttpServer())
        .get(`${API}/${licence.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent licence', async () => {
      await request(getApp().getHttpServer())
        .delete(`${API}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
