import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligne la FK `helloasso_payment.payer_user_id` sur le pattern `ON DELETE SET NULL`
 * déjà utilisé par `helloasso_details.linked_by_user_id`. Le `ON DELETE RESTRICT`
 * initial bloquait la suppression de compte (RGPD) dès qu'un user avait un
 * paiement, même historique (refused/refunded).
 *
 * L'entity stocke déjà des snapshots (`payer_firebase_uid`, `payer_first_name`,
 * `payer_last_name`) pour préserver l'audit comptable indépendamment de la
 * ligne user. La FK passe donc en SET NULL et la colonne devient nullable.
 *
 * L'anonymisation des snapshots est traitée applicativement par
 * `AuthFirebaseService.deleteAccount` (UPDATE avant DELETE user).
 */
export class AllowUserDeleteOnHelloAssoPayment1779292800000
  implements MigrationInterface
{
  name = 'AllowUserDeleteOnHelloAssoPayment1779292800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "FK_helloasso_payment_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ALTER COLUMN "payer_user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "FK_helloasso_payment_user" FOREIGN KEY ("payer_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" DROP CONSTRAINT "FK_helloasso_payment_user"`,
    );
    // Attention : si des lignes ont déjà payer_user_id=NULL (users supprimés),
    // le ALTER NOT NULL plantera. C'est le comportement attendu d'un down après
    // un usage réel : on ne peut pas revenir en arrière sans perte d'historique.
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ALTER COLUMN "payer_user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "helloasso_payment" ADD CONSTRAINT "FK_helloasso_payment_user" FOREIGN KEY ("payer_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
