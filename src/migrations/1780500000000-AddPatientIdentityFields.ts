import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientIdentityFields1780500000000 implements MigrationInterface {
    name = 'AddPatientIdentityFields1780500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make userId nullable to support patients without user accounts
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "userId" DROP NOT NULL`);

        // Add identity columns
        await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "firstName" character varying`);
        await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "lastName" character varying`);
        await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "email" character varying`);
        await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone" character varying`);

        // Add vitals column
        await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "vitals" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "vitals"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "userId" SET NOT NULL`);
    }
}
