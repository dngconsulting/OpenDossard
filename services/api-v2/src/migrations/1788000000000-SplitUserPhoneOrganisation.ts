import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sépare `user.phone`, qui mélangeait numéro et club/comité, en `phone`
 * (numéro seul) + `organisation` (texte libre).
 *
 * Formes observées en PROD le 2026-09-30 (51 formes, ~70 comptes, base
 * entièrement couverte) : « 10 chiffres + espace + texte » ou « texte seul ».
 * Règle STRICTE, rien n'est deviné :
 *   - 10 chiffres en tête + espace + texte → découpé ;
 *   - aucune suite ressemblant à un numéro (8 chiffres ou plus, séparés au plus
 *     par un espace, un point ou un tiret) → tout dans `organisation`, `phone`
 *     NULL. Un numéro de département (« Comité FSGT 31 ») reste donc du texte ;
 *   - sinon (ex. « Club 06 12 34 56 78 ») → inchangé, et compté dans les logs.
 *
 * `[[:space:]]` et non `\s` : dans un template literal TS, `\s` devient `s`.
 * down() recolle `phone + ' ' + organisation` (format d'origine aux espaces
 * près : `up()` normalise les blancs).
 */
export class SplitUserPhoneOrganisation1788000000000 implements MigrationInterface {
  name = 'SplitUserPhoneOrganisation1788000000000';

  private readonly logger = new Logger(SplitUserPhoneOrganisation1788000000000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "organisation" varchar NULL`);

    // Les deux SET lisent la valeur AVANT mise à jour (sémantique SQL).
    await queryRunner.query(`
      UPDATE "user"
      SET organisation = btrim(substring(phone FROM '^[[:space:]]*[0-9]{10}[[:space:]]+(.*)$')),
          phone        = substring(phone FROM '^[[:space:]]*([0-9]{10})[[:space:]]')
      WHERE phone ~ '^[[:space:]]*[0-9]{10}[[:space:]]+[^[:space:]]'
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET organisation = btrim(phone),
          phone        = NULL
      WHERE btrim(phone) <> '' AND phone !~ '[0-9]([[:space:].-]?[0-9]){7,}'
    `);

    // Après les deux UPDATE, tout ce qui n'est pas un numéro nu contient une
    // suite ressemblant à un numéro dans une forme non reconnue.
    const [{ n }] = (await queryRunner.query(`
      SELECT count(*)::int AS n FROM "user"
      WHERE btrim(phone) <> '' AND phone !~ '^[0-9]{10}$'
    `)) as { n: number }[];
    if (n > 0) {
      this.logger.warn(
        `${n} valeur(s) de phone hors format « 10 chiffres » laissée(s) intacte(s) (forme mixte ou numéro formaté), à vérifier`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // concat_ws ignore les NULL : phone NULL + organisation → organisation seule.
    // NULLIF : un phone vidé ('') ne doit pas laisser d'espace en tête.
    await queryRunner.query(`
      UPDATE "user"
      SET phone = concat_ws(' ', NULLIF(phone, ''), organisation)
      WHERE organisation IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "organisation"`);
  }
}
