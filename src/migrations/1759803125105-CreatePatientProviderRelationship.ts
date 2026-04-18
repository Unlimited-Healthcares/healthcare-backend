import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatientProviderRelationship1759803125105 implements MigrationInterface {
    name = 'CreatePatientProviderRelationship1759803125105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_provider_relationships_provider_type_enum') THEN
                    CREATE TYPE "public"."patient_provider_relationships_provider_type_enum" AS ENUM('doctor', 'center');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_provider_relationships_status_enum') THEN
                    CREATE TYPE "public"."patient_provider_relationships_status_enum" AS ENUM('pending', 'approved', 'rejected');
                END IF;
            END $$;
        `);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "patient_provider_relationships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "provider_type" "public"."patient_provider_relationships_provider_type_enum" NOT NULL, "status" "public"."patient_provider_relationships_status_enum" NOT NULL DEFAULT 'approved', "approved_at" TIMESTAMP, "approved_by" uuid, "request_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6dc14bada293b0632d295b75b93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON COLUMN "patient_provider_relationships"."provider_type" IS 'Type of provider: doctor (individual) or center (healthcare facility)'`);
        await queryRunner.query(`COMMENT ON COLUMN "patient_provider_relationships"."status" IS 'Status of the relationship'`);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e209b572a16d6316fb2e2f9357" ON "patient_provider_relationships" ("patient_id", "provider_id", "provider_type") `);

        // Cleanup orphaned records that would violate foreign key constraints
        await queryRunner.query(`DELETE FROM "patient_provider_relationships" WHERE "patient_id" NOT IN (SELECT id FROM patients)`);
        await queryRunner.query(`DELETE FROM "patient_provider_relationships" WHERE "provider_type" = 'doctor' AND "provider_id" NOT IN (SELECT id FROM users)`);
        await queryRunner.query(`DELETE FROM "patient_provider_relationships" WHERE "provider_type" = 'center' AND "provider_id" NOT IN (SELECT id FROM healthcare_centers)`);
        await queryRunner.query(`UPDATE "patient_provider_relationships" SET "approved_by" = NULL WHERE "approved_by" IS NOT NULL AND "approved_by" NOT IN (SELECT id FROM users)`);

        // Use a helper to add constraints only if they don't exist
        const addConstraintIfNotExists = async (table: string, constraintName: string, sql: string) => {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}') THEN
                        ${sql};
                    END IF;
                END $$;
            `);
        };

        await addConstraintIfNotExists('patient_provider_relationships', 'FK_32538941c42eb77f6eeb16d5919',
            `ALTER TABLE "patient_provider_relationships" ADD CONSTRAINT "FK_32538941c42eb77f6eeb16d5919" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // These polymorphic constraints are logically impossible to satisfy in a single column 
        // and are disabled in the actual entity (@ManyToOne createForeignKeyConstraints: false).
        // Removing them to let the migration pass.

        /*
        await addConstraintIfNotExists('patient_provider_relationships', 'FK_patient_provider_user', 
            `ALTER TABLE "patient_provider_relationships" ADD CONSTRAINT "FK_patient_provider_user" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            
        await addConstraintIfNotExists('patient_provider_relationships', 'FK_patient_provider_center', 
            `ALTER TABLE "patient_provider_relationships" ADD CONSTRAINT "FK_patient_provider_center" FOREIGN KEY ("provider_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            
        await addConstraintIfNotExists('patient_provider_relationships', 'FK_aa6314a5ae962aebe0fcf196816', 
            `ALTER TABLE "patient_provider_relationships" ADD CONSTRAINT "FK_aa6314a5ae962aebe0fcf196816" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        */
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_provider_relationships" DROP CONSTRAINT "FK_aa6314a5ae962aebe0fcf196816"`);
        await queryRunner.query(`ALTER TABLE "patient_provider_relationships" DROP CONSTRAINT "FK_patient_provider_center"`);
        await queryRunner.query(`ALTER TABLE "patient_provider_relationships" DROP CONSTRAINT "FK_patient_provider_user"`);
        await queryRunner.query(`ALTER TABLE "patient_provider_relationships" DROP CONSTRAINT "FK_32538941c42eb77f6eeb16d5919"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e209b572a16d6316fb2e2f9357"`);
        await queryRunner.query(`DROP TABLE "patient_provider_relationships"`);
        await queryRunner.query(`DROP TYPE "public"."patient_provider_relationships_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."patient_provider_relationships_provider_type_enum"`);
    }

}
