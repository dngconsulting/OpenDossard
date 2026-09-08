import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute de quoi dissocier les six causes que `helloasso_payment.status =
 * 'refused'` agrège aujourd'hui : refus bancaire, erreur technique, abandon du
 * tunnel, annulation côté HelloAsso, annulation par le coureur, remplacement
 * par une nouvelle tentative — auxquelles s'ajoute l'expiration automatique.
 *
 * Le mapping `PaymentState` → `status` n'est PAS modifié : les 5 statuts
 * internes restent tels quels, et le type union exposé aux clients (webapp-v2 et
 * DossardeurV2, en production) n'est pas touché.
 *
 *  - `helloasso_last_state` : dernier `PaymentState` BRUT, y compris les états
 *    que le mapping ignore. C'est cette écriture sur les états non mappés qui
 *    rend le support possible sur un paiement figé en `pending`.
 *  - `helloasso_last_state_at` : « HelloAsso n'a plus rien dit depuis quand ? »
 *  - `status_source` : QUI a écrit le statut. Deux des six causes (annulation
 *    par le coureur, remplacement) ne produisent aucun événement HelloAsso et
 *    seraient indiscernables sans ce marqueur.
 *
 * `varchar` plutôt qu'un enum PostgreSQL pour `status_source` : ajouter une
 * valeur ne doit pas imposer une migration de type, et une valeur inconnue doit
 * retomber sur le libellé « cause inconnue » plutôt que faire échouer la lecture.
 *
 * Colonnes nullables, AUCUN backfill : l'historique n'est pas reconstituable.
 * Les lignes existantes restent NULL et tombent sur le libellé legacy.
 */
export class AddPaymentStatusDetail1784000000000 implements MigrationInterface {
  name = 'AddPaymentStatusDetail1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ` +
        `ADD COLUMN "helloasso_last_state" VARCHAR(32) NULL, ` +
        `ADD COLUMN "helloasso_last_state_at" TIMESTAMP NULL, ` +
        `ADD COLUMN "status_source" VARCHAR(24) NULL`,
    );

    // Index PARTIEL au service du job d'expiration, qui balaie toutes les 5 min
    // les `pending` antérieurs au seuil. Sans lui, chaque run scanne la table
    // entière — invisible aujourd'hui, coûteux à mesure que les paiements
    // s'accumulent.
    //
    // Partiel sur `status = 'pending'` : seules les lignes réellement candidates
    // sont indexées. Un paiement quitte `pending` définitivement, donc l'index
    // reste petit quelle que soit la taille de la table — il ne contient que les
    // paiements en cours, soit quelques lignes en régime normal.
    await queryRunner.query(
      `CREATE INDEX "idx_helloasso_payment_pending_created_at" ` +
        `ON "helloasso_payment" ("created_at") WHERE "status" = 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_helloasso_payment_pending_created_at"`);
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ` +
        `DROP COLUMN "status_source", ` +
        `DROP COLUMN "helloasso_last_state_at", ` +
        `DROP COLUMN "helloasso_last_state"`,
    );
  }
}
