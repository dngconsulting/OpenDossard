import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sépare la liaison HelloAsso (propre à l'orga) du rattachement des clubs.
 *
 * Une même entité juridique a une seule orga HelloAsso mais peut organiser sous
 * plusieurs clubs OpenDossard (un par fédération). HelloAsso ne garde qu'un
 * grant actif par (partenaire, orga) : la chaîne de tokens appartient à l'orga.
 *
 *  - `helloasso_organization` (nouvelle) : slug UNIQUE, tokens chiffrés,
 *    expirations, dernier refresh, conformité d'encaissement.
 *  - `helloasso_details` devient le rattachement club → orga : `club_id`
 *    (UNIQUE), `organization_id` (FK RESTRICT), `linked_at`, `linked_by_user_id`.
 *
 * Reprise : une orga par slug existant, avec la chaîne de la ligne la plus
 * récente (slug encore unique à ce stade : une ligne par slug en pratique).
 *
 * `down` reconstitue l'ancienne table ; échoue (contrainte UNIQUE sur le slug)
 * si une orga est déjà partagée par plusieurs clubs — voulu : un retour arrière
 * silencieux casserait l'un des rattachements.
 */
export class SplitHelloAssoOrganization1792000000000 implements MigrationInterface {
  name = 'SplitHelloAssoOrganization1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "helloasso_organization" (
        "id"                          SERIAL       PRIMARY KEY,
        "organization_slug"           VARCHAR(255) NOT NULL,
        "access_token"                TEXT         NOT NULL,
        "refresh_token"               TEXT         NOT NULL,
        "access_token_expires_at"     TIMESTAMP    NOT NULL,
        "refresh_token_expires_at"    TIMESTAMP    NOT NULL,
        "last_refreshed_at"           TIMESTAMP        NULL,
        "is_cash_in_compliant"        BOOLEAN          NULL,
        "created_at"                  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_helloasso_organization_slug" UNIQUE ("organization_slug")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "helloasso_organization" (
        "organization_slug", "access_token", "refresh_token",
        "access_token_expires_at", "refresh_token_expires_at",
        "last_refreshed_at", "is_cash_in_compliant", "created_at"
      )
      SELECT DISTINCT ON ("organization_slug")
        "organization_slug", "access_token", "refresh_token",
        "access_token_expires_at", "refresh_token_expires_at",
        "last_refreshed_at", "is_cash_in_compliant", "created_at"
      FROM "helloasso_details"
      ORDER BY "organization_slug", "refresh_token_expires_at" DESC, "updated_at" DESC
    `);

    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD COLUMN "organization_id" INTEGER NULL`,
    );
    await queryRunner.query(`
      UPDATE "helloasso_details" d
      SET "organization_id" = o."id"
      FROM "helloasso_organization" o
      WHERE o."organization_slug" = d."organization_slug"
    `);
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ALTER COLUMN "organization_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "FK_helloasso_details_organization" FOREIGN KEY ("organization_id") REFERENCES "helloasso_organization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_helloasso_details_organization_id" ON "helloasso_details" ("organization_id")`,
    );

    await queryRunner.query(`DROP INDEX "IDX_helloasso_details_access_expires"`);
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "UQ_helloasso_details_organization_slug"`,
    );
    await queryRunner.query(`
      ALTER TABLE "helloasso_details"
        DROP COLUMN "organization_slug",
        DROP COLUMN "access_token",
        DROP COLUMN "refresh_token",
        DROP COLUMN "access_token_expires_at",
        DROP COLUMN "refresh_token_expires_at",
        DROP COLUMN "last_refreshed_at",
        DROP COLUMN "is_cash_in_compliant"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "helloasso_details"
        ADD COLUMN "organization_slug"        VARCHAR(255) NULL,
        ADD COLUMN "access_token"             TEXT         NULL,
        ADD COLUMN "refresh_token"            TEXT         NULL,
        ADD COLUMN "access_token_expires_at"  TIMESTAMP    NULL,
        ADD COLUMN "refresh_token_expires_at" TIMESTAMP    NULL,
        ADD COLUMN "last_refreshed_at"        TIMESTAMP    NULL,
        ADD COLUMN "is_cash_in_compliant"     BOOLEAN      NULL
    `);
    await queryRunner.query(`
      UPDATE "helloasso_details" d
      SET "organization_slug"        = o."organization_slug",
          "access_token"             = o."access_token",
          "refresh_token"            = o."refresh_token",
          "access_token_expires_at"  = o."access_token_expires_at",
          "refresh_token_expires_at" = o."refresh_token_expires_at",
          "last_refreshed_at"        = o."last_refreshed_at",
          "is_cash_in_compliant"     = o."is_cash_in_compliant"
      FROM "helloasso_organization" o
      WHERE o."id" = d."organization_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "helloasso_details"
        ALTER COLUMN "organization_slug" SET NOT NULL,
        ALTER COLUMN "access_token" SET NOT NULL,
        ALTER COLUMN "refresh_token" SET NOT NULL,
        ALTER COLUMN "access_token_expires_at" SET NOT NULL,
        ALTER COLUMN "refresh_token_expires_at" SET NOT NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD CONSTRAINT "UQ_helloasso_details_organization_slug" UNIQUE ("organization_slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_helloasso_details_access_expires" ON "helloasso_details" ("access_token_expires_at")`,
    );
    await queryRunner.query(`DROP INDEX "IDX_helloasso_details_organization_id"`);
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" DROP CONSTRAINT "FK_helloasso_details_organization"`,
    );
    await queryRunner.query(`ALTER TABLE "helloasso_details" DROP COLUMN "organization_id"`);
    await queryRunner.query(`DROP TABLE "helloasso_organization"`);
  }
}
