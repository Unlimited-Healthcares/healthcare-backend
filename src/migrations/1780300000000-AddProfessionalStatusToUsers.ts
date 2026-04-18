import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfessionalStatusToUsers1780300000000 implements MigrationInterface {
    name = 'AddProfessionalStatusToUsers1780300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_professionalstatus_enum') THEN
                    CREATE TYPE "public"."users_professionalstatus_enum" AS ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');
                END IF;
            END $$;
        `);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "professionalStatus" "public"."users_professionalstatus_enum" NOT NULL DEFAULT 'NOT_STARTED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "professionalStatus"`);
        await queryRunner.query(`DROP TYPE "public"."users_professionalstatus_enum"`);
    }
}
