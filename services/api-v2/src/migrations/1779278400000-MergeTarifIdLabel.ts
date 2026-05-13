import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Merge `tarif_id` + `tarif_label_snapshot` en une seule colonne `tarif_id`.
 *
 * Contexte : depuis le refacto `045922e` (suppression du champ `id` séparé
 * dans `PricingInfo`), les 2 colonnes stockaient strictement la même valeur
 * (le `tarif.name`). `tarif_id` était limité à varchar(64) et tronquait,
 * `tarif_label_snapshot` à varchar(255). Cleanup : on garde uniquement
 * `tarif_id`, widened à varchar(255) pour ne plus tronquer.
 */
export class MergeTarifIdLabel1779278400000 implements MigrationInterface {
  name = 'MergeTarifIdLabel1779278400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Widen tarif_id à varchar(255) pour pouvoir contenir le label complet.
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ALTER COLUMN "tarif_id" TYPE varchar(255)`,
    );

    // 2) Backfill : copier la valeur complète depuis label_snapshot vers tarif_id
    //    (au cas où certaines lignes avaient le label tronqué à 64 chars).
    await queryRunner.query(
      `UPDATE "helloasso_payment" SET "tarif_id" = "tarif_label_snapshot" WHERE "tarif_label_snapshot" IS NOT NULL`,
    );

    // 3) Drop la colonne devenue redondante.
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP COLUMN "tarif_label_snapshot"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore la colonne supprimée + remet la troncature 64 sur tarif_id.
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD COLUMN "tarif_label_snapshot" varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `UPDATE "helloasso_payment" SET "tarif_label_snapshot" = "tarif_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ALTER COLUMN "tarif_id" TYPE varchar(64) USING substring("tarif_id" FROM 1 FOR 64)`,
    );
  }
}
