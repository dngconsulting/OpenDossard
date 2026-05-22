import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute les colonnes d'audit `author` (varchar) et `last_changed` (timestamp)
 * sur les tables `club`, `competition` et `race`.
 *
 * Modèle identique à la table `licence` (déjà auditée). Colonnes nullables, pas
 * de backfill : les lignes existantes restent NULL, l'audit démarre au
 * déploiement. Pose effectuée par les services applicatifs juste avant chaque
 * `.save()` (pattern explicite, voir `licences.service.ts`).
 */
export class AddAuditColumns1780000000000 implements MigrationInterface {
  name = 'AddAuditColumns1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "club" ADD COLUMN "author" VARCHAR NULL`);
    await queryRunner.query(`ALTER TABLE "club" ADD COLUMN "last_changed" TIMESTAMP NULL`);

    await queryRunner.query(`ALTER TABLE "competition" ADD COLUMN "author" VARCHAR NULL`);
    await queryRunner.query(`ALTER TABLE "competition" ADD COLUMN "last_changed" TIMESTAMP NULL`);

    await queryRunner.query(`ALTER TABLE "race" ADD COLUMN "author" VARCHAR NULL`);
    await queryRunner.query(`ALTER TABLE "race" ADD COLUMN "last_changed" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "race" DROP COLUMN "last_changed"`);
    await queryRunner.query(`ALTER TABLE "race" DROP COLUMN "author"`);

    await queryRunner.query(`ALTER TABLE "competition" DROP COLUMN "last_changed"`);
    await queryRunner.query(`ALTER TABLE "competition" DROP COLUMN "author"`);

    await queryRunner.query(`ALTER TABLE "club" DROP COLUMN "last_changed"`);
    await queryRunner.query(`ALTER TABLE "club" DROP COLUMN "author"`);
  }
}
