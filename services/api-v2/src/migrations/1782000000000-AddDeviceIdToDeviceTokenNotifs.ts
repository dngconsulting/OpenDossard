import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute `device_id` (identité stable de l'appareil, UUID d'installation
 * généré côté app) à `device_token_notifs`. Permet d'upsert / désenregistrer
 * un appareil par son identité plutôt que par le token FCM, qui peut tourner
 * (root cause du bug d'opt-out iOS : token en base périmé → delete par token
 * ratait, l'appareil restait notifié).
 *
 * Colonne NULLABLE : les lignes existantes (pré-device_id) restent valides en
 * legacy ; elles seront purgées au fil des ré-enregistrements / opt-out des
 * appareils (cf. DeviceTokenNotifsService).
 */
export class AddDeviceIdToDeviceTokenNotifs1782000000000 implements MigrationInterface {
  name = 'AddDeviceIdToDeviceTokenNotifs1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_token_notifs" ADD COLUMN "device_id" VARCHAR(64)`);

    // Unicité de l'appareil quand renseigné (1 ligne par device_id). Index
    // PARTIEL : les multiples lignes legacy à device_id NULL restent permises.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_device_token_notifs_device_id" ON "device_token_notifs" ("device_id") WHERE "device_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_device_token_notifs_device_id"`);
    await queryRunner.query(`ALTER TABLE "device_token_notifs" DROP COLUMN "device_id"`);
  }
}
