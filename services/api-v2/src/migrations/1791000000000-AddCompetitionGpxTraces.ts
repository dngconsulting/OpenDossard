import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tracés GPX des circuits, déposés par les organisateurs et stockés chez nous.
 * Le parcours d'un circuit est SOIT un lien (`info3`), SOIT un GPX déposé
 * (`gpxTraceId`), jamais les deux.
 *
 *  - competition_gpx_trace : points du GPX déposé (format compact, cf.
 *    `gpx-points.ts`, ~4x plus petit que le fichier) et tracé calculé (profil,
 *    stats), tous deux compressés gzip. Un circuit de `competition.competition_info`
 *    le référence par son `gpxTraceId` (uuid généré côté API, pas d'extension
 *    SQL). CASCADE : supprimer l'épreuve supprime ses tracés.
 *  - Liens de circuit vides (`info3: ""`) retirés : l'app 4.1.9 affiche
 *    « Voir le tracé » dès que la clé existe, et ouvre alors une URL vide. Non
 *    annulé par `down` (une clé vide n'a aucun sens à restaurer).
 */
export class AddCompetitionGpxTraces1791000000000 implements MigrationInterface {
  name = 'AddCompetitionGpxTraces1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "competition_gpx_trace" (
        "id" UUID PRIMARY KEY,
        "competition_id" INTEGER NOT NULL,
        "name" TEXT NULL,
        "gpx_points_gz" BYTEA NOT NULL,
        "track_gz" BYTEA NOT NULL,
        "distance" DOUBLE PRECISION NOT NULL,
        "ascent" DOUBLE PRECISION NOT NULL,
        "descent" DOUBLE PRECISION NOT NULL,
        "min_elevation" DOUBLE PRECISION NOT NULL,
        "max_elevation" DOUBLE PRECISION NOT NULL,
        "point_count" INTEGER NOT NULL,
        "elevation_source" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_competition_gpx_trace_elevation_source"
          CHECK ("elevation_source" IN ('ign', 'gpx', 'none')),
        CONSTRAINT "FK_competition_gpx_trace_competition" FOREIGN KEY ("competition_id")
          REFERENCES "competition"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_competition_gpx_trace_competition" ON "competition_gpx_trace" ("competition_id")`,
    );

    await queryRunner.query(`
      UPDATE "competition" c
      SET "competition_info" = (
        SELECT json_agg(
          CASE WHEN json_typeof(info.value) = 'object' AND btrim(info.value->>'info3') = ''
            THEN (info.value::jsonb - 'info3')::json
            ELSE info.value
          END ORDER BY info.position)
        FROM json_array_elements(c."competition_info") WITH ORDINALITY AS info(value, position)
      )
      WHERE json_typeof(c."competition_info") = 'array'
        AND EXISTS (
          SELECT 1 FROM json_array_elements(c."competition_info") AS info(value)
          WHERE json_typeof(info.value) = 'object' AND btrim(info.value->>'info3') = ''
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "competition_gpx_trace"`);
  }
}
