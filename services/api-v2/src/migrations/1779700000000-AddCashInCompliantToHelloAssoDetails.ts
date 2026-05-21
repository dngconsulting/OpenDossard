import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCashInCompliantToHelloAssoDetails1779700000000 implements MigrationInterface {
  name = 'AddCashInCompliantToHelloAssoDetails1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "helloasso_details" ADD COLUMN "is_cash_in_compliant" BOOLEAN NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "helloasso_details" DROP COLUMN "is_cash_in_compliant"`);
  }
}
