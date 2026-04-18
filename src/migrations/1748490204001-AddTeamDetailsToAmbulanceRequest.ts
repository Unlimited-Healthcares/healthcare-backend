import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamDetailsToAmbulanceRequest1748490204001 implements MigrationInterface {
    name = 'AddTeamDetailsToAmbulanceRequest1748490204001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ambulance_requests" ADD COLUMN IF NOT EXISTS "team_details" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ambulance_requests" DROP COLUMN "team_details"`);
    }
}
