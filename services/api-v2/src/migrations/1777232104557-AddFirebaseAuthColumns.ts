import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirebaseAuthColumns1777232104557 implements MigrationInterface {
  name = 'AddFirebaseAuthColumns1777232104557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "firebase_uid" character varying(128), ADD "sign_in_provider" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_firebase_uid" UNIQUE ("firebase_uid")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_firebase_uid" ON "user" ("firebase_uid")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_firebase_uid"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_firebase_uid"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sign_in_provider"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firebase_uid"`);
  }
}
