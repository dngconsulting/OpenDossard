import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cycle de vie des challenges : clôture + archive du classement.
 *
 * `closed_at` est indépendant de `active` (= visibilité, contrat DossardeurV2
 * inchangé). À la clôture, le classement live est figé dans deux tables
 * normalisées, pour pouvoir les interroger plus tard en SQL (palmarès,
 * propositions de montée de catégorie).
 *
 *  - licence    : RESTRICT (un coureur archivé a couru, sa licence n'est déjà
 *                 pas supprimable côté service)
 *  - competition: SET NULL (nom et date copiés, l'archive reste lisible)
 *  - challenge  : CASCADE (supprimer un challenge supprime son archive)
 *
 * Pas de backfill : les challenges existants restent en cours.
 */
export class AddChallengeArchive1787000000000 implements MigrationInterface {
  name = 'AddChallengeArchive1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "challenge" ` +
        `ADD COLUMN "closed_at" TIMESTAMPTZ NULL, ` +
        `ADD COLUMN "closed_by" INTEGER NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "challenge" ADD CONSTRAINT "FK_challenge_closed_by" ` +
        `FOREIGN KEY ("closed_by") REFERENCES "user"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE "challenge_archive_rider" (
        "id" SERIAL PRIMARY KEY,
        "challenge_id" INTEGER NOT NULL,
        "licence_id" INTEGER NOT NULL,
        "gender" TEXT NULL,
        "catev" TEXT NULL,
        "catea" TEXT NULL,
        "club" TEXT NULL,
        "name" TEXT NULL,
        "first_name" TEXT NULL,
        "pts_all_races" DOUBLE PRECISION NOT NULL,
        "explanation" TEXT NULL,
        "sprintchallenge" BOOLEAN NULL,
        "rank" INTEGER NOT NULL,
        CONSTRAINT "FK_challenge_archive_rider_challenge" FOREIGN KEY ("challenge_id")
          REFERENCES "challenge"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_archive_rider_licence" FOREIGN KEY ("licence_id")
          REFERENCES "licence"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_challenge_archive_rider_challenge_licence" ` +
        `ON "challenge_archive_rider" ("challenge_id", "licence_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_challenge_archive_rider_licence" ON "challenge_archive_rider" ("licence_id")`,
    );
    await queryRunner.query(`
      CREATE TABLE "challenge_archive_race_row" (
        "id" SERIAL PRIMARY KEY,
        "archive_rider_id" INTEGER NOT NULL,
        "competition_id" INTEGER NULL,
        "competition_name" TEXT NULL,
        "event_date" TIMESTAMP NULL,
        "catev" TEXT NULL,
        "ranking_scratch" INTEGER NULL,
        "nb_participants" INTEGER NOT NULL,
        "comment" TEXT NULL,
        "sprintchallenge" BOOLEAN NULL,
        "pts_race" DOUBLE PRECISION NOT NULL,
        "explanation" TEXT NULL,
        CONSTRAINT "FK_challenge_archive_race_row_rider" FOREIGN KEY ("archive_rider_id")
          REFERENCES "challenge_archive_rider"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_archive_race_row_competition" FOREIGN KEY ("competition_id")
          REFERENCES "competition"("id") ON DELETE SET NULL
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_challenge_archive_race_row_rider" ON "challenge_archive_race_row" ("archive_rider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_challenge_archive_race_row_competition" ON "challenge_archive_race_row" ("competition_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "challenge_archive_race_row"`);
    await queryRunner.query(`DROP TABLE "challenge_archive_rider"`);
    await queryRunner.query(`ALTER TABLE "challenge" DROP CONSTRAINT "FK_challenge_closed_by"`);
    await queryRunner.query(
      `ALTER TABLE "challenge" DROP COLUMN "closed_by", DROP COLUMN "closed_at"`,
    );
  }
}
