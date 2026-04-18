import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagesAndSpecificationsToEquipment1773339165000 implements MigrationInterface {
    name = 'AddImagesAndSpecificationsToEquipment1773339165000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add images column as a text array
        await queryRunner.query(`ALTER TABLE "equipment_items" ADD COLUMN IF NOT EXISTS "images" text array`);

        // Add specifications column as jsonb
        await queryRunner.query(`ALTER TABLE "equipment_items" ADD COLUMN IF NOT EXISTS "specifications" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "equipment_items" DROP COLUMN "specifications"`);
        await queryRunner.query(`ALTER TABLE "equipment_items" DROP COLUMN "images"`);
    }
}
