import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table de liaison user ↔ club pour le modèle d'autorisation scopé.
 *
 * Cf. design `~/.claude/projects/-Users-sami-projets-OpenDossard/2026-05-19-opendossard-autorisations-design.md`.
 *
 * - PK composite `(user_id, club_id)` : empêche les doublons sans surrogate id.
 * - FKs CASCADE : si on supprime un user ou un club, ses liens disparaissent.
 * - Pas de colonne `role` : modèle plat "lié = tous droits sur le club".
 */
export class AddUserClub1779600000000 implements MigrationInterface {
  name = 'AddUserClub1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_club" (
        "user_id"    INTEGER   NOT NULL,
        "club_id"    INTEGER   NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_club" PRIMARY KEY ("user_id", "club_id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "user_club" ADD CONSTRAINT "FK_user_club_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_club" ADD CONSTRAINT "FK_user_club_club" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Index secondaires sur chaque FK. La PK composite (user_id, club_id) couvre
    // déjà les lookups par (user_id) seul (premier discriminant), mais pas les
    // lookups par (club_id) seul → on indexe explicitement.
    await queryRunner.query(`CREATE INDEX "idx_user_club_user" ON "user_club" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_club_club" ON "user_club" ("club_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_club_club"`);
    await queryRunner.query(`DROP INDEX "idx_user_club_user"`);
    await queryRunner.query(`ALTER TABLE "user_club" DROP CONSTRAINT "FK_user_club_club"`);
    await queryRunner.query(`ALTER TABLE "user_club" DROP CONSTRAINT "FK_user_club_user"`);
    await queryRunner.query(`DROP TABLE "user_club"`);
  }
}
