import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMissingPatientRecords1759804000000 implements MigrationInterface {
    name = 'CreateMissingPatientRecords1759804000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create missing Patient records for existing users with patient role
        await queryRunner.query(`
            INSERT INTO "patients" ("id", "userId", "patientId", "createdAt", "updatedAt", "isActive")
            SELECT 
                gen_random_uuid() as "id",
                u."id" as "userId",
                'PT' || EXTRACT(EPOCH FROM NOW())::bigint || LPAD(ROW_NUMBER() OVER (ORDER BY u."createdAt")::text, 6, '0') as "patientId",
                NOW() as "createdAt",
                NOW() as "updatedAt",
                true as "isActive"
            FROM "users" u
            WHERE u."roles" LIKE '%patient%'
            AND NOT EXISTS (
                SELECT 1 FROM "patients" p WHERE p."userId"::uuid = u."id"
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove Patient records that were created by this migration
        // Note: This is a destructive operation, use with caution
        await queryRunner.query(`
            DELETE FROM "patients" 
            WHERE "patientId" LIKE 'PT%' 
            AND "createdAt" >= NOW() - INTERVAL '1 hour'
        `);
    }
}
