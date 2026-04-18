import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetsManagement1780000000000 implements MigrationInterface {
    name = 'CreateAssetsManagement1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create facility_assets table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "facility_assets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "center_id" uuid,
                "user_id" uuid,
                "asset_type" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "category" character varying,
                "uses" text,
                "base_price" decimal(10,2),
                "duration_minutes" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_facility_assets" PRIMARY KEY ("id")
            )
        `);

        // Ensure columns exist (in case table was created with different schema)
        const addColumnIfNotExists = async (table: string, column: string, type: string) => {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table}' AND column_name='${column}') THEN
                        ALTER TABLE "${table}" ADD COLUMN "${column}" ${type};
                    END IF;
                END $$;
            `);
        };

        await addColumnIfNotExists('facility_assets', 'center_id', 'uuid');
        await addColumnIfNotExists('facility_assets', 'user_id', 'uuid');
        await addColumnIfNotExists('facility_assets', 'asset_type', 'character varying NOT NULL');
        await addColumnIfNotExists('facility_assets', 'name', 'character varying NOT NULL');
        await addColumnIfNotExists('facility_assets', 'description', 'text');
        await addColumnIfNotExists('facility_assets', 'category', 'character varying');
        await addColumnIfNotExists('facility_assets', 'uses', 'text');
        await addColumnIfNotExists('facility_assets', 'base_price', 'decimal(10,2)');
        await addColumnIfNotExists('facility_assets', 'duration_minutes', 'integer');
        await addColumnIfNotExists('facility_assets', 'is_active', 'boolean NOT NULL DEFAULT true');

        // Add foreign keys safely
        const addFKIfNotExists = async (table: string, fkName: string, sql: string) => {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${fkName}') THEN
                        ${sql};
                    END IF;
                END $$;
            `);
        };

        await addFKIfNotExists('facility_assets', 'FK_facility_assets_center',
            'ALTER TABLE "facility_assets" ADD CONSTRAINT "FK_facility_assets_center" FOREIGN KEY ("center_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE');

        await addFKIfNotExists('facility_assets', 'FK_facility_assets_user',
            'ALTER TABLE "facility_assets" ADD CONSTRAINT "FK_facility_assets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE');

        // Add indexes for search performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_facility_assets_center_id" ON "facility_assets" ("center_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_facility_assets_user_id" ON "facility_assets" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_facility_assets_type" ON "facility_assets" ("asset_type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_facility_assets_name" ON "facility_assets" ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_facility_assets_name"`);
        await queryRunner.query(`DROP INDEX "idx_facility_assets_type"`);
        await queryRunner.query(`DROP INDEX "idx_facility_assets_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_facility_assets_center_id"`);
        await queryRunner.query(`DROP TABLE "facility_assets"`);
    }
}
