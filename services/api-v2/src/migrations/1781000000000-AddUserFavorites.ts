import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table `user_favorites` : épreuves starrées par les utilisateurs mobiles.
 * Base de la feature notifications push organisateur → users ayant starré.
 */
export class AddUserFavorites1781000000000 implements MigrationInterface {
  name = 'AddUserFavorites1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_favorites" (
        "id"              SERIAL     PRIMARY KEY,
        "user_id"         INTEGER    NOT NULL,
        "competition_id"  INTEGER    NOT NULL,
        "created_at"      TIMESTAMP  NOT NULL DEFAULT now()
      )
    `);

    // Unicité (user, compétition) : un star est idempotent (ON CONFLICT DO
    // NOTHING côté service). L'index unique sert aussi le lookup « favoris
    // d'un user » (préfixe user_id).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_favorites_user_competition" ON "user_favorites" ("user_id", "competition_id")`,
    );

    // Index du fan-out notifications : « tous les users ayant starré l'épreuve X ».
    await queryRunner.query(
      `CREATE INDEX "IDX_user_favorites_competition" ON "user_favorites" ("competition_id")`,
    );

    // FK ON DELETE CASCADE : suppression du compte (RGPD) ou de l'épreuve →
    // purge automatique des favoris.
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_competition" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_favorites"`);
  }
}
