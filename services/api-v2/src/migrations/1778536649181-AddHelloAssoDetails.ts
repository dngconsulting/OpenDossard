import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHelloAssoDetails1778536649181 implements MigrationInterface {
  name = 'AddHelloAssoDetails1778536649181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "helloasso_details" (
        "id"                          SERIAL       PRIMARY KEY,
        "club_id"                     INTEGER      NOT NULL,
        "organization_slug"           VARCHAR(255) NOT NULL,
        "access_token"                TEXT         NOT NULL,
        "refresh_token"               TEXT         NOT NULL,
        "access_token_expires_at"     TIMESTAMP    NOT NULL,
        "refresh_token_expires_at"    TIMESTAMP    NOT NULL,
        "linked_by_user_id"           INTEGER          NULL,
        "linked_at"                   TIMESTAMP    NOT NULL,
        "last_refreshed_at"           TIMESTAMP        NULL,
        "created_at"                  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "UQ_helloasso_details_club_id" UNIQUE ("club_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "UQ_helloasso_details_organization_slug" UNIQUE ("organization_slug")`,
    );

    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "FK_helloasso_details_club" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "FK_helloasso_details_user" FOREIGN KEY ("linked_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_helloasso_details_access_expires" ON "helloasso_details" ("access_token_expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_helloasso_details_access_expires"`);
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "FK_helloasso_details_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "FK_helloasso_details_club"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "UQ_helloasso_details_organization_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "UQ_helloasso_details_club_id"`,
    );
    await queryRunner.query(`DROP TABLE "helloasso_details"`);
  }
}
