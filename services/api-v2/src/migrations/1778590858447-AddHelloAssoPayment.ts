import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHelloAssoPayment1778590858447 implements MigrationInterface {
  name = 'AddHelloAssoPayment1778590858447';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Flag d'activation du paiement en ligne sur competition.
    await queryRunner.query(
      `ALTER TABLE "competition" ADD COLUMN "online_registration_enabled" BOOLEAN NOT NULL DEFAULT FALSE`,
    );

    // 2) Enum Postgres pour le statut.
    await queryRunner.query(
      `CREATE TYPE "helloasso_payment_status_enum" AS ENUM ('pending', 'paid', 'refused', 'refunded')`,
    );

    // 3) Table helloasso_payment.
    await queryRunner.query(`
      CREATE TABLE "helloasso_payment" (
        "id"                            SERIAL                            PRIMARY KEY,
        "competition_id"                INTEGER                           NOT NULL,
        "licence_id"                    INTEGER                           NOT NULL,
        "payer_user_id"                 INTEGER                           NOT NULL,
        "payer_firebase_uid"            VARCHAR(128)                          NULL,
        "payer_first_name"              VARCHAR(255)                          NULL,
        "payer_last_name"               VARCHAR(255)                          NULL,
        "helloasso_checkout_intent_id"  VARCHAR(64)                           NULL,
        "helloasso_order_id"            VARCHAR(64)                           NULL,
        "helloasso_payment_id"          VARCHAR(64)                           NULL,
        "status"                        "helloasso_payment_status_enum"   NOT NULL DEFAULT 'pending',
        "tarif_id"                      VARCHAR(64)                       NOT NULL,
        "tarif_label_snapshot"          VARCHAR(255)                      NOT NULL,
        "amount_cents"                  INTEGER                           NOT NULL,
        "paid_at"                       TIMESTAMP                             NULL,
        "created_at"                    TIMESTAMP                         NOT NULL DEFAULT now()
      )
    `);

    // 4) Contraintes UNIQUE sur les IDs HelloAsso (nullables OK : Postgres autorise plusieurs NULL).
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "UQ_helloasso_payment_checkout_intent_id" UNIQUE ("helloasso_checkout_intent_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "UQ_helloasso_payment_order_id" UNIQUE ("helloasso_order_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "UQ_helloasso_payment_payment_id" UNIQUE ("helloasso_payment_id")`,
    );

    // 5) FKs avec RESTRICT — empêche la suppression d'un club/licence/user s'il a des paiements.
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "FK_helloasso_payment_competition" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "FK_helloasso_payment_licence" FOREIGN KEY ("licence_id") REFERENCES "licence"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "FK_helloasso_payment_user" FOREIGN KEY ("payer_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // 6) Index secondaires sur les FKs pour les requêtes de lookup.
    await queryRunner.query(`CREATE INDEX "IDX_helloasso_payment_competition" ON "helloasso_payment" ("competition_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_helloasso_payment_licence" ON "helloasso_payment" ("licence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_helloasso_payment_payer_user" ON "helloasso_payment" ("payer_user_id")`);

    // 7) Anti-doublon : partial unique index. Empêche d'avoir 2 paiements actifs (pending OU paid)
    // pour le même couple (competition, licence). Les statuts refused/refunded autorisent une retry.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_helloasso_payment_active" ON "helloasso_payment" ("competition_id", "licence_id") WHERE "status" IN ('pending', 'paid')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_helloasso_payment_active"`);
    await queryRunner.query(`DROP INDEX "IDX_helloasso_payment_payer_user"`);
    await queryRunner.query(`DROP INDEX "IDX_helloasso_payment_licence"`);
    await queryRunner.query(`DROP INDEX "IDX_helloasso_payment_competition"`);

    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "FK_helloasso_payment_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "FK_helloasso_payment_licence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "FK_helloasso_payment_competition"`,
    );

    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "UQ_helloasso_payment_payment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "UQ_helloasso_payment_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "UQ_helloasso_payment_checkout_intent_id"`,
    );

    await queryRunner.query(`DROP TABLE "helloasso_payment"`);
    await queryRunner.query(`DROP TYPE "helloasso_payment_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "competition" DROP COLUMN "online_registration_enabled"`,
    );
  }
}
