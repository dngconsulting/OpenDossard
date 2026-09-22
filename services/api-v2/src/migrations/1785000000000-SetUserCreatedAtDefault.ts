import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Pose `DEFAULT now()` sur `user.created_at`.
 *
 * La 1783 avait ajouté la colonne sans default, en comptant sur
 * `@CreateDateColumn` pour la remplir. Or TypeORM n'écrit jamais la date de
 * création lui-même : son INSERT envoie le mot-clé `DEFAULT` et s'en remet à
 * la base. Sans default en base, chaque nouvel user Open Dossard naissait donc
 * avec `created_at = NULL` et la colonne « Créé le » du backoffice restait vide.
 *
 * Passé inaperçu en e2e : le schéma de test sort de `synchronize()`, qui pose
 * le default depuis les métadonnées, pas des migrations.
 *
 * AUCUN backfill : la date de création des comptes existants n'est pas
 * reconstituable, ils restent NULL (« — » dans le backoffice).
 */
export class SetUserCreatedAtDefault1785000000000 implements MigrationInterface {
  name = 'SetUserCreatedAtDefault1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" DROP DEFAULT`);
  }
}
