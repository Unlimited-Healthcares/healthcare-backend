import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicesToProfiles1780100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add services JSONB column to profiles table for nurses and other healthcare professionals
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "services" JSONB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP COLUMN IF EXISTS "services"`
    );
  }
}
