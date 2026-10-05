import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renomme les catégories d'âge des licences FFC dans la nomenclature FFC
 * (U7…U23 / Senior / Master), en remplacement des codes FSGT.
 *
 * Simple RENOMMAGE, aucun recalcul depuis l'âge : la catégorie reste celle
 * attribuée à la licence (un Junior reste U19 même s'il a vieilli depuis), elle
 * sera revue à l'actualisation de la licence. Codes neutres, sans préfixe F :
 * le genre est porté par la licence (FPO et PO → U9).
 *
 * Correspondance : PUC/MO → U7, PO → U9, PU → U11, B → U13, M → U15, C → U17,
 * J → U19, E → U23, S → Senior, V/SV/A/SA → Master. NC et tout code inconnu
 * restent inchangés.
 *
 * Périmètre : `licence` FFC uniquement. Les engagements (`race.catea`) et les
 * archives de challenge gardent leur copie figée à l'inscription.
 *
 * down() restaure les codes FSGT (préfixe F selon le genre), sauf la
 * distinction Vétéran/Super Vétéran/Ancien/Super Ancien, perdue : Master → V.
 */
const RENAMES: Record<string, string> = {
  PUC: 'U7',
  MO: 'U7',
  PO: 'U9',
  PU: 'U11',
  B: 'U13',
  M: 'U15',
  C: 'U17',
  J: 'U19',
  E: 'U23',
  S: 'Senior',
  V: 'Master',
  SV: 'Master',
  A: 'Master',
  SA: 'Master',
};

const DOWN_RENAMES: Record<string, string> = {
  U7: 'MO',
  U9: 'PO',
  U11: 'PU',
  U13: 'B',
  U15: 'M',
  U17: 'C',
  U19: 'J',
  U23: 'E',
  Senior: 'S',
  Master: 'V',
};

export class MigrateFfcAgeCategories1789000000000 implements MigrationInterface {
  name = 'MigrateFfcAgeCategories1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of Object.entries(RENAMES)) {
      await queryRunner.query(
        `UPDATE licence SET catea = $1 WHERE fede = 'FFC' AND catea IN ($2::varchar, 'F' || $2::varchar)`,
        [newCode, oldCode],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [newCode, oldCode] of Object.entries(DOWN_RENAMES)) {
      await queryRunner.query(
        `UPDATE licence
         SET catea = (CASE WHEN gender = 'F' THEN 'F' ELSE '' END) || $1
         WHERE fede = 'FFC' AND catea = $2`,
        [oldCode, newCode],
      );
    }
  }
}
