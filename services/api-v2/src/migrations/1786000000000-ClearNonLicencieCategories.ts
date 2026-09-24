import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vide les catégories de valeur (route et CX) des licences NL.
 *
 * Ces catégories sont réglementées par une fédé : elles n'ont pas de sens pour
 * un non-licencié. La catégorie d'âge (`catea`) est conservée. L'historique des
 * classements n'est pas impacté : chaque engagement (`race.catev`) porte sa
 * propre copie de la catégorie, figée à l'inscription.
 *
 * IRRÉVERSIBLE : les valeurs effacées ne sont pas sauvegardées, `down` ne fait
 * rien. Restauration éventuelle via les sauvegardes de la base.
 */
export class ClearNonLicencieCategories1786000000000 implements MigrationInterface {
  name = 'ClearNonLicencieCategories1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE licence SET catev = NULL, catev_cx = NULL WHERE fede = 'NL' AND (catev IS NOT NULL OR catev_cx IS NOT NULL)`,
    );
  }

  public async down(): Promise<void> {
    // Irréversible : cf. doc de la classe.
  }
}
