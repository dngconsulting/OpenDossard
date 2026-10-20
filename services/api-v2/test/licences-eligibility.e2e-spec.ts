import * as request from 'supertest';

import { DataSource } from 'typeorm';

import { getApp, getAuthHelper, getSeedHelper } from './setup-e2e';
import { CompetitionType, Federation } from '../src/common/enums';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { LicenceEntity } from '../src/licences/entities/licence.entity';
import { LicenceSearchResultDto } from '../src/licences/dto';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { seedHelloAssoLink } from './helpers/helloasso-link.seed';
import { HelloAssoPaymentEntity } from '../src/helloasso/entities/helloasso-payment.entity';

const API = '/api/v2/licences/search';

describe('Licences — éligibilité selon la fédé de l’épreuve (e2e)', () => {
  let dataSource: DataSource;
  let mobileToken: string;

  beforeAll(() => {
    dataSource = getApp().get(DataSource);
    mobileToken = getAuthHelper().getMobileToken();
  });

  afterEach(async () => {
    await getSeedHelper().cleanCompetitions();
    await getSeedHelper().cleanLicences();
  });

  // Les colonnes `opened_*` et `birth_year` sont nullable en base, pas dans le
  // typage des entités : les helpers acceptent null et le transmettent tel quel.
  type Access = { openedToOtherFede: boolean | null; openedNL: boolean | null };
  type LicenceSeed = Omit<Partial<LicenceEntity>, 'birthYear'> & { birthYear?: string | null };

  async function seedCompetition(
    access: Access,
    extra: Partial<CompetitionEntity> = {},
  ): Promise<CompetitionEntity> {
    const repo = dataSource.getRepository(CompetitionEntity);
    return repo.save(
      repo.create({
        name: 'Prix FSGT',
        eventDate: new Date('2026-11-15T09:00:00Z'),
        zipCode: '31000',
        categories: '1,2,3',
        races: '1/2,3',
        fede: Federation.FSGT,
        competitionType: CompetitionType.ROUTE,
        dept: '31',
        ...(access as Pick<CompetitionEntity, keyof Access>),
        ...extra,
      }),
    );
  }

  async function seedLicence(licence: LicenceSeed): Promise<LicenceEntity> {
    const repo = dataSource.getRepository(LicenceEntity);
    return repo.save(
      repo.create({ dept: '31', birthYear: '1980', ...(licence as Partial<LicenceEntity>) }),
    );
  }

  async function search(q: string, competitionId?: number): Promise<LicenceSearchResultDto[]> {
    const res = await request(getApp().getHttpServer())
      .get(API)
      .query(competitionId === undefined ? { q } : { q, competitionId })
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);
    return res.body as LicenceSearchResultDto[];
  }

  function eligibilityOf(results: LicenceSearchResultDto[], id: number) {
    return results.find(r => r.id === id)?.eligibility;
  }

  it('sans competitionId : réponse inchangée, pas de champ eligibility', async () => {
    await seedLicence({ name: 'MARTIN', firstName: 'Paul', fede: Federation.UFOLEP });

    const results = await search('MARTIN');

    expect(results).toHaveLength(1);
    expect(results[0]).not.toHaveProperty('eligibility');
  });

  it('épreuve fermée : la licence UFOLEP est refusée mais reste dans les résultats', async () => {
    const competition = await seedCompetition({ openedToOtherFede: false, openedNL: false });
    const fsgt = await seedLicence({ name: 'MARTIN', firstName: 'Paul', fede: Federation.FSGT });
    const ufolep = await seedLicence({
      name: 'MARTIN',
      firstName: 'Paul',
      fede: Federation.UFOLEP,
    });

    const results = await search('MARTIN', competition.id);

    expect(results).toHaveLength(2);
    expect(eligibilityOf(results, fsgt.id)).toBe('OK');
    expect(eligibilityOf(results, ufolep.id)).toBe('FEDE_NOT_ALLOWED');
  });

  it('openedToOtherFede et openedNL null valent false', async () => {
    const competition = await seedCompetition({ openedToOtherFede: null, openedNL: null });
    const ffvelo = await seedLicence({
      name: 'MARTIN',
      firstName: 'Paul',
      fede: Federation.FFVELO,
    });
    const nl = await seedLicence({ name: 'MARTIN', firstName: 'Lea', fede: Federation.NL });

    const results = await search('MARTIN', competition.id);

    expect(eligibilityOf(results, ffvelo.id)).toBe('FEDE_NOT_ALLOWED');
    expect(eligibilityOf(results, nl.id)).toBe('NL_NOT_ALLOWED');
  });

  it('non licencié accepté si openedNL', async () => {
    const competition = await seedCompetition({ openedToOtherFede: false, openedNL: true });
    const nl = await seedLicence({ name: 'MARTIN', firstName: 'Lea', fede: Federation.NL });

    const results = await search('MARTIN', competition.id);

    expect(eligibilityOf(results, nl.id)).toBe('OK');
  });

  describe('épreuve ouverte aux autres fédés', () => {
    it('demande confirmation si le même coureur a une licence FSGT (accents et casse ignorés)', async () => {
      const competition = await seedCompetition({ openedToOtherFede: true, openedNL: false });
      await seedLicence({ name: 'LÉVÊQUE', firstName: 'Jérôme', fede: Federation.FSGT });
      const ufolep = await seedLicence({
        name: 'leveque',
        firstName: ' JEROME ',
        fede: Federation.UFOLEP,
      });

      const results = await search('leveque', competition.id);

      expect(eligibilityOf(results, ufolep.id)).toBe('CONFIRM_OTHER_FEDE');
    });

    it('accepte sans confirmation un coureur sans licence FSGT', async () => {
      const competition = await seedCompetition({ openedToOtherFede: true, openedNL: false });
      const ffc = await seedLicence({ name: 'MARTIN', firstName: 'Paul', fede: Federation.FFC });

      const results = await search('MARTIN', competition.id);

      expect(eligibilityOf(results, ffc.id)).toBe('OK');
    });

    it('un homonyme né une autre année n’est pas le même coureur', async () => {
      const competition = await seedCompetition({ openedToOtherFede: true, openedNL: false });
      await seedLicence({
        name: 'MARTIN',
        firstName: 'Paul',
        birthYear: '1990',
        fede: Federation.FSGT,
      });
      const ufolep = await seedLicence({
        name: 'MARTIN',
        firstName: 'Paul',
        birthYear: '1980',
        fede: Federation.UFOLEP,
      });

      const results = await search('MARTIN', competition.id);

      expect(eligibilityOf(results, ufolep.id)).toBe('OK');
    });

    it('une année de naissance vide ne correspond jamais', async () => {
      const competition = await seedCompetition({ openedToOtherFede: true, openedNL: false });
      await seedLicence({
        name: 'MARTIN',
        firstName: 'Paul',
        birthYear: null,
        fede: Federation.FSGT,
      });
      const ufolep = await seedLicence({
        name: 'MARTIN',
        firstName: 'Paul',
        birthYear: null,
        fede: Federation.UFOLEP,
      });

      const results = await search('MARTIN', competition.id);

      expect(eligibilityOf(results, ufolep.id)).toBe('OK');
    });
  });

  it('competitionId inconnu → 404', async () => {
    await request(getApp().getHttpServer())
      .get(API)
      .query({ q: 'MARTIN', competitionId: 999999 })
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(404);
  });

  describe('POST /helloasso/payments/checkout-intent', () => {
    afterEach(async () => {
      await getSeedHelper().cleanClubs();
    });

    // Épreuve payable en ligne : club lié à HelloAsso et tarif numérique. Les
    // refus ont lieu avant tout appel HelloAsso : aucun mock n'est nécessaire.
    async function seedPayableCompetition(access: Access): Promise<CompetitionEntity> {
      const club = await dataSource.getRepository(ClubEntity).save({
        longName: 'Club éligibilité',
        shortName: 'CE',
        dept: '31',
        federation: Federation.FSGT,
      });
      await seedHelloAssoLink(dataSource, {
        clubId: club.id,
        organizationSlug: `orga-eligibilite-${club.id}`,
      });
      return seedCompetition(access, {
        clubId: club.id,
        onlineRegistrationEnabled: true,
        pricing: [{ name: 'Adulte', tarif: 10 }],
      });
    }

    it.each([
      [Federation.UFOLEP, 'LICENCE_FEDE_NOT_ALLOWED'],
      [Federation.NL, 'LICENCE_NL_NOT_ALLOWED'],
    ])('refuse (422) une licence %s sur une épreuve FSGT fermée', async (fede, code) => {
      const competition = await seedPayableCompetition({
        openedToOtherFede: false,
        openedNL: false,
      });
      const licence = await seedLicence({ name: 'MARTIN', firstName: 'Paul', fede });

      const res = await request(getApp().getHttpServer())
        .post('/api/v2/helloasso/payments/checkout-intent')
        .set('Authorization', `Bearer ${mobileToken}`)
        .send({
          competitionId: competition.id,
          tarifName: 'Adulte',
          licenceId: licence.id,
          payerProfile: { firstName: 'Paul', lastName: 'Martin', email: 'paul@example.com' },
        })
        .expect(422);

      const body = res.body as { code: string; message: string };
      expect(Object.keys(body).sort()).toEqual(['code', 'message']);
      expect(body.code).toBe(code);
      expect(body.message).not.toBe('');
      expect(await dataSource.getRepository(HelloAssoPaymentEntity).count()).toBe(0);
    });
  });
});
