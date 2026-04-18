import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGovernmentIdToProfiles1780200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "governmentIdType" VARCHAR(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "governmentIdNumber" VARCHAR(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "governmentIdDoc" TEXT`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "governmentIdDoc"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "governmentIdNumber"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "governmentIdType"`);
  }
}
