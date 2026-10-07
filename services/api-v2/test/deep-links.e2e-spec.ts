import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { getApp, getSeedHelper } from './setup-e2e';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';

/**
 * Pages de fallback des liens partagés depuis l'app (Universal Links / App
 * Links), servies quand l'app n'est pas installée.
 *
 * En prod ces routes sont hors du préfixe `/api` (exclusion `app/(.*)` dans
 * `main.ts`) ; la suite e2e applique le préfixe sans exclusion, d'où `/api/app`.
 */
const BASE = '/api/app';

describe('Deep links (e2e)', () => {
  afterEach(async () => {
    await getSeedHelper().cleanCompetitions();
  });

  async function seedCompetitionWithCircuits(): Promise<CompetitionEntity> {
    const [competition] = await getSeedHelper().seedCompetitions();
    const repo = getApp().get(DataSource).getRepository(CompetitionEntity);
    competition.competitionInfo = [
      {
        course: '110 km',
        info1: '110kms',
        info2: '2600m D+',
        info3: 'https://www.openrunner.com/r/8308363',
      },
      { course: '60 km', info3: 'javascript:alert(1)' },
    ];
    return repo.save(competition);
  }

  describe('GET /app/epreuve/:id/parcours/:index', () => {
    it('should render the circuit title, details and the web trace link', async () => {
      const competition = await seedCompetitionWithCircuits();

      const res = await request(getApp().getHttpServer())
        .get(`${BASE}/epreuve/${competition.id}/parcours/0`)
        .expect(200)
        .expect('Content-Type', /html/);

      expect(res.text).toContain('Parcours : 110 km — Grand Prix de Toulouse');
      expect(res.text).toContain('2600m D+');
      expect(res.text).toContain(`dossardeur://epreuve/${competition.id}/parcours/0`);
      expect(res.text).toContain('href="https://www.openrunner.com/r/8308363"');
    });

    it('should not expose a non-http trace link', async () => {
      const competition = await seedCompetitionWithCircuits();

      const res = await request(getApp().getHttpServer())
        .get(`${BASE}/epreuve/${competition.id}/parcours/1`)
        .expect(200);

      expect(res.text).toContain('Parcours : 60 km — Grand Prix de Toulouse');
      expect(res.text).not.toContain('javascript:');
      expect(res.text).not.toContain('Voir le tracé sur le web');
    });

    it('should fall back to the competition name for an unknown circuit index', async () => {
      const competition = await seedCompetitionWithCircuits();

      const res = await request(getApp().getHttpServer())
        .get(`${BASE}/epreuve/${competition.id}/parcours/9`)
        .expect(200);

      expect(res.text).toContain('Parcours — Grand Prix de Toulouse');
    });

    it('should render a generic page for an unknown competition', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`${BASE}/epreuve/999999/parcours/0`)
        .expect(200);

      expect(res.text).toContain('<h1>Parcours</h1>');
      expect(res.text).toContain('dossardeur://epreuve/999999/parcours/0');
    });

    it('should escape HTML coming from the circuit name', async () => {
      const [competition] = await getSeedHelper().seedCompetitions();
      const repo = getApp().get(DataSource).getRepository(CompetitionEntity);
      competition.competitionInfo = [{ course: '<script>x</script>' }];
      await repo.save(competition);

      const res = await request(getApp().getHttpServer())
        .get(`${BASE}/epreuve/${competition.id}/parcours/0`)
        .expect(200);

      expect(res.text).not.toContain('<script>x</script>');
      expect(res.text).toContain('&lt;script&gt;x&lt;/script&gt;');
    });
  });
});
