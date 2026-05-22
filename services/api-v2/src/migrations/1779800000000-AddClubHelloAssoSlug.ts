import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la colonne `helloasso_slug` sur la table `club`.
 *
 * Remplace l'ancien matching `slugify(elicenceName) === organization_slug` par
 * un lookup direct du slug HelloAsso configuré sur le club. La colonne est
 * nullable (vide par défaut) : un club non encore relié à HelloAsso n'a pas de
 * slug renseigné, et le callback OAuth invite alors l'utilisateur à le saisir.
 */
export class AddClubHelloAssoSlug1779800000000 implements MigrationInterface {
  name = 'AddClubHelloAssoSlug1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "club" ADD COLUMN "helloasso_slug" TEXT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "club" DROP COLUMN "helloasso_slug"`);
  }
}
