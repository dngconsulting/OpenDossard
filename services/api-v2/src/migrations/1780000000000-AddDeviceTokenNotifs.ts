import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table `device_token_notifs` : tokens FCM des appareils pour les push de
 * confirmation de paiement HelloAsso (cf. design push-notifs-paiement).
 */
export class AddDeviceTokenNotifs1780000000000 implements MigrationInterface {
  name = 'AddDeviceTokenNotifs1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "device_token_notifs" (
        "id"          SERIAL        PRIMARY KEY,
        "token"       VARCHAR(512)  NOT NULL,
        "user_id"     INTEGER       NOT NULL,
        "platform"    VARCHAR(16)   NOT NULL,
        "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP     NOT NULL DEFAULT now()
      )
    `);

    // Unicité par token (1 token = 1 install) — un nouvel enregistrement du même
    // token réaffecte le user_id (logout A → login B sur le même appareil).
    await queryRunner.query(
      `ALTER TABLE "device_token_notifs" ADD CONSTRAINT "UQ_device_token_notifs_token" UNIQUE ("token")`,
    );

    // FK ON DELETE CASCADE : suppression du compte → purge auto des tokens.
    await queryRunner.query(
      `ALTER TABLE "device_token_notifs" ADD CONSTRAINT "FK_device_token_notifs_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Index de lookup par user (ciblage à l'envoi).
    await queryRunner.query(
      `CREATE INDEX "IDX_device_token_notifs_user" ON "device_token_notifs" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device_token_notifs"`);
  }
}
