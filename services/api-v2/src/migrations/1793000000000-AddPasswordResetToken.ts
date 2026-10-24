import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tokens de réinitialisation de mot de passe (« mot de passe oublié »), envoyés
 * par email, à usage unique et valables 1 h.
 *
 *  - Seul le hash SHA-256 (hex, 64 caractères) est stocké : une fuite de la
 *    table ne permet pas de réinitialiser un compte. UNIQUE pour retrouver le
 *    token à partir du hash reçu.
 *  - `used_at` renseigné à la consommation : un token déjà utilisé est refusé.
 *  - Index unique partiel sur `user_id` des tokens non utilisés : un seul lien
 *    actif par user, même en cas de demandes simultanées. L'index simple sur
 *    `user_id` reste utile à la cascade, qui parcourt aussi les tokens utilisés.
 *  - CASCADE : supprimer le user supprime ses tokens.
 *  - Pas de DEFAULT sur `created_at` : toutes les dates sont fournies par Node.
 */
export class AddPasswordResetToken1793000000000 implements MigrationInterface {
  name = 'AddPasswordResetToken1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_token" (
        "id"          SERIAL      PRIMARY KEY,
        "user_id"     INTEGER     NOT NULL,
        "token_hash"  VARCHAR(64) NOT NULL,
        "expires_at"  TIMESTAMP   NOT NULL,
        "used_at"     TIMESTAMP       NULL,
        "created_at"  TIMESTAMP   NOT NULL,
        CONSTRAINT "FK_password_reset_token_user" FOREIGN KEY ("user_id")
          REFERENCES "user"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_password_reset_token_hash" ON "password_reset_token" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_token_user" ON "password_reset_token" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_password_reset_token_active_user" ON "password_reset_token" ("user_id") WHERE "used_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_token"`);
  }
}
