import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAmbulanceRequestedBy1780700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Finalizing ambulance_requests table: populating requested_by...');

        // Ensure requested_by exists (nullable: true was added in entity)
        const hasRequestedBy = await queryRunner.hasColumn('ambulance_requests', 'requested_by');
        if (!hasRequestedBy) {
            await queryRunner.query('ALTER TABLE ambulance_requests ADD COLUMN "requested_by" VARCHAR(255)');
        }

        // Populate with fallback value for existing records
        await queryRunner.query('UPDATE ambulance_requests SET "requested_by" = \'SYSTEM_UPGRADE\' WHERE "requested_by" IS NULL');

        console.log('✅ ambulance_requests requested_by populated');
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Drop the column if needed, but usually we keep it
    }
}
