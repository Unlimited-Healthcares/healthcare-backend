import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePostGISAndAddLocation1780800000000 implements MigrationInterface {
    name = 'EnablePostGISAndAddLocation1780800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Enable PostGIS extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

        // 2. Add geography location column to healthcare_centers
        await queryRunner.query(`
            ALTER TABLE "healthcare_centers" 
            ADD COLUMN "location" geography(Point, 4326)
        `);

        // 3. Populate location column from existing latitude and longitude
        await queryRunner.query(`
            UPDATE "healthcare_centers" 
            SET "location" = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);

        // 4. Add GIST index for spatial queries
        await queryRunner.query(`
            CREATE INDEX "idx_healthcare_centers_location" ON "healthcare_centers" USING GIST ("location")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_healthcare_centers_location"`);
        await queryRunner.query(`ALTER TABLE "healthcare_centers" DROP COLUMN "location"`);
        // We don't drop the extension because other parts of the DB might use it later
    }

}
