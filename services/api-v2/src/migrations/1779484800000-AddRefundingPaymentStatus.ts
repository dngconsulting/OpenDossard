import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute le statut `refunding` à `helloasso_payment_status_enum` (refund en
 * cours côté HelloAsso, pas encore confirmé bancairement).
 *
 * Étend également le partial unique index `UQ_helloasso_payment_active` pour
 * que `refunding` bloque le slot `(competition, licence)` au même titre que
 * `pending` et `paid` — un coureur ne peut pas se ré-engager tant que le
 * refund n'est pas confirmé (cas où le refund échoue → le payment reste `paid`,
 * on ne veut pas de double engagement).
 *
 * `transaction = false` : `ALTER TYPE ... ADD VALUE` ne peut pas être suivi
 * d'une utilisation de la nouvelle valeur dans la même transaction (PostgreSQL
 * restriction). Chaque statement s'exécute dans sa propre transaction.
 *
 * Note `down()` : PostgreSQL ne permet pas de retirer une valeur d'un enum
 * sans recréer le type complet (rebuild + recast). En pratique on ne fait
 * jamais le rollback d'un ajout d'enum value en prod — la migration descend
 * uniquement l'index, la valeur `refunding` reste dans l'enum (inutilisée
 * tant qu'aucune row ne l'utilise).
 */
export class AddRefundingPaymentStatus1779484800000 implements MigrationInterface {
  name = 'AddRefundingPaymentStatus1779484800000';
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Ajout de la valeur enum (idempotent grâce à `IF NOT EXISTS`).
    await queryRunner.query(
      `ALTER TYPE "helloasso_payment_status_enum" ADD VALUE IF NOT EXISTS 'refunding'`,
    );

    // 2) Recréation du partial unique index avec `refunding` inclus.
    await queryRunner.query(`DROP INDEX "UQ_helloasso_payment_active"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_helloasso_payment_active" ON "helloasso_payment" ("competition_id", "licence_id") WHERE "status" IN ('pending', 'paid', 'refunding')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore l'ancien index (sans `refunding`). La valeur enum `refunding`
    // est laissée en place — `ALTER TYPE DROP VALUE` n'existe pas en PostgreSQL.
    // Pré-requis : aucune row ne doit avoir status='refunding' au moment du
    // down, sinon le nouvel index échouera silencieusement à les exclure (ce
    // qui est OK fonctionnellement mais on perd le blocage de slot pour ces rows).
    await queryRunner.query(`DROP INDEX "UQ_helloasso_payment_active"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_helloasso_payment_active" ON "helloasso_payment" ("competition_id", "licence_id") WHERE "status" IN ('pending', 'paid')`,
    );
  }
}
