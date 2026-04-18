import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBioVitalsToProfiles1762200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bloodGroup" VARCHAR(10)`);
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "genotype" VARCHAR(10)`);
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "height" DECIMAL(5,2)`);
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(5,2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "weight"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "height"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "genotype"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "bloodGroup"`);
  }
}
