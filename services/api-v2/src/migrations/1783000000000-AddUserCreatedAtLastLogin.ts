import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute `created_at` et `last_login_at` sur la table `user`.
 *
 * Cible : les users backoffice Open Dossard (firebase_uid NULL). Les users
 * Dossardeur (Firebase Auth) tirent déjà leurs dates des métadonnées Firebase
 * (creationTime/lastSignInTime, non persistées) — ces deux colonnes restent
 * NULL pour eux.
 *
 * Colonnes nullables, PAS de backfill (modèle identique à AddAuditColumns) :
 *  - `created_at` : posé par TypeORM (@CreateDateColumn) sur les nouveaux comptes.
 *    Les comptes existants restent NULL (date de création non récupérable).
 *  - `last_login_at` : mis à jour à chaque login email/password (auth.service).
 *    Démarre NULL ; un compte pré-déploiement le renseigne dès sa prochaine
 *    connexion.
 */
export class AddUserCreatedAtLastLogin1783000000000 implements MigrationInterface {
  name = 'AddUserCreatedAtLastLogin1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "created_at" TIMESTAMP NULL, ADD COLUMN "last_login_at" TIMESTAMP NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "last_login_at", DROP COLUMN "created_at"`,
    );
  }
}
