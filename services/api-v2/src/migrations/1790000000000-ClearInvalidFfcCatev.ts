import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vide (NULL) les catégories de valeur route et CX des licences FFC qui ne
 * font pas partie de la liste FFC (codes FSGT hérités : 1…5, C, M, J, PO…,
 * anciens codes PASSOPEN, PASSCYCLISME, DAMES…). Aucune correspondance n'est
 * tentée : le commissaire ou l'import resaisira la bonne catégorie.
 *
 * Liste de référence : catev FFC de `webapp-v2/src/config/federations.ts`,
 * qui sert aussi pour le CX.
 *
 * Périmètre : `licence` FFC uniquement. Les engagements (`race.catev`) gardent
 * leur copie figée à l'inscription.
 *
 * IRRÉVERSIBLE : les valeurs effacées ne sont pas sauvegardées, `down` ne fait
 * rien. Restauration éventuelle via les sauvegardes de la base.
 */
const FFC_CATEV = [
  'ELITE',
  'OPEN1',
  'OPEN1VTT',
  'OPEN2',
  'OPEN3',
  'U19',
  'U17',
  'U15',
  'U13',
  'U11',
  'U9',
  'U7',
  'ACCESS1',
  'ACCESS2',
  'ACCESS3',
  'ACCESS4',
  'MASSE',
];

export class ClearInvalidFfcCatev1790000000000 implements MigrationInterface {
  name = 'ClearInvalidFfcCatev1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['catev', 'catev_cx']) {
      await queryRunner.query(
        `UPDATE licence SET ${column} = NULL
         WHERE fede = 'FFC' AND ${column} IS NOT NULL AND ${column} <> ALL($1::varchar[])`,
        [FFC_CATEV],
      );
    }
  }

  public async down(): Promise<void> {
    // Irréversible : cf. doc de la classe.
  }
}
