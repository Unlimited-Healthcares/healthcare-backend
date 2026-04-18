import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncHealthcareCenters1780600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Syncing healthcare_centers table with frontend requirements...');

        // Add business_registration_number if it doesn't exist
        const hasBusRegNum = await queryRunner.hasColumn('healthcare_centers', 'business_registration_number');
        if (!hasBusRegNum) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "business_registration_number" VARCHAR(255)');
        }

        // Add business_registration_doc_url if it doesn't exist
        const hasBusRegDoc = await queryRunner.hasColumn('healthcare_centers', 'business_registration_doc_url');
        if (!hasBusRegDoc) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "business_registration_doc_url" TEXT');
        }

        // Add emergency_contact if it doesn't exist
        const hasEmergencyContact = await queryRunner.hasColumn('healthcare_centers', 'emergency_contact');
        if (!hasEmergencyContact) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "emergency_contact" VARCHAR(255)');
        }

        // Add owner_id if it doesn't exist
        const hasOwnerId = await queryRunner.hasColumn('healthcare_centers', 'owner_id');
        if (!hasOwnerId) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "owner_id" UUID');
        }

        // Ensure practice_number is snake_case (rename if practiceNumber exists)
        const hasPracticeNumberCamel = await queryRunner.hasColumn('healthcare_centers', 'practiceNumber');
        const hasPracticeNumberSnake = await queryRunner.hasColumn('healthcare_centers', 'practice_number');

        if (hasPracticeNumberCamel && !hasPracticeNumberSnake) {
            await queryRunner.query('ALTER TABLE healthcare_centers RENAME COLUMN "practiceNumber" TO "practice_number"');
        } else if (!hasPracticeNumberSnake) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "practice_number" VARCHAR(255)');
        }

        // Ensure display_id exists (rename if displayId exists)
        const hasDisplayIdCamel = await queryRunner.hasColumn('healthcare_centers', 'displayId');
        const hasDisplayIdSnake = await queryRunner.hasColumn('healthcare_centers', 'display_id');

        if (hasDisplayIdCamel && !hasDisplayIdSnake) {
            await queryRunner.query('ALTER TABLE healthcare_centers RENAME COLUMN "displayId" TO "display_id"');
        } else if (!hasDisplayIdSnake) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "display_id" VARCHAR(255) UNIQUE');
        }

        // Populate display_id for existing records if null
        const results = await queryRunner.query('SELECT id FROM healthcare_centers WHERE "display_id" IS NULL');
        for (const row of results) {
            const displayId = `HCN-${row.id.split('-')[0].toUpperCase()}`;
            await queryRunner.query('UPDATE healthcare_centers SET "display_id" = $1 WHERE id = $2', [displayId, row.id]);
        }

        // Sync 'centerType' to 'type' if needed
        const hasCenterType = await queryRunner.hasColumn('healthcare_centers', 'centerType');
        const hasType = await queryRunner.hasColumn('healthcare_centers', 'type');

        if (hasCenterType && !hasType) {
            await queryRunner.query('ALTER TABLE healthcare_centers RENAME COLUMN "centerType" TO "type"');
        } else if (!hasType) {
            await queryRunner.query('ALTER TABLE healthcare_centers ADD COLUMN "type" VARCHAR(255)');
        }

        console.log('✅ healthcare_centers table synced successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Non-trivial to revert exactly without knowing previous state, but we can drop added columns
        await queryRunner.query('ALTER TABLE healthcare_centers DROP COLUMN IF EXISTS "business_registration_number"');
        await queryRunner.query('ALTER TABLE healthcare_centers DROP COLUMN IF EXISTS "business_registration_doc_url"');
        await queryRunner.query('ALTER TABLE healthcare_centers DROP COLUMN IF EXISTS "emergency_contact"');
        await queryRunner.query('ALTER TABLE healthcare_centers DROP COLUMN IF EXISTS "owner_id"');
    }
}
