import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Permet à la colonne `user.email` d'être NULL.
 * Nécessaire pour les users mode firebase, dont l'email n'est PAS persisté
 * côté backend (source de vérité = Firebase Auth, accédée via le idToken).
 *
 * Les users legacy (backoffice + mobile pré-firebase) gardent leur email
 * tel quel — la migration ne touche à aucune ligne existante.
 */
export class MakeEmailNullable1777318504557 implements MigrationInterface {
  name = 'MakeEmailNullable1777318504557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-imposer NOT NULL n'est sûr que si aucune ligne firebase n'a NULL.
    // Le rollback peut donc échouer en pratique — assumé.
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`,
    );
  }
}
