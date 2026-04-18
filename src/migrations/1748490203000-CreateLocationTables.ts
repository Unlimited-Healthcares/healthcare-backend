import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationTables1748490203000 implements MigrationInterface {
  name = 'CreateLocationTables1748490203000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create location_history table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS location_history (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "entityType" VARCHAR(50) NOT NULL,
        "entityId" UUID NOT NULL,
        "latitude" DECIMAL(10,8) NOT NULL,
        "longitude" DECIMAL(11,8) NOT NULL,
        "accuracy" DECIMAL(8,2),
        "source" VARCHAR(50) DEFAULT 'manual',
        "previousAddress" TEXT,
        "newAddress" TEXT,
        "updatedBy" UUID,
        "updateReason" TEXT,
        "metadata" JSONB,
        "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create geofence_zones table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS geofence_zones (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "centerLatitude" DECIMAL(10,8) NOT NULL,
        "centerLongitude" DECIMAL(11,8) NOT NULL,
        "radius" DECIMAL(8,2) NOT NULL,
        "centerId" UUID,
        "status" VARCHAR(20) DEFAULT 'active',
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for location_history
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_location_history_entity ON location_history ("entityType", "entityId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_location_history_timestamp ON location_history ("timestamp");
    `);

    // Create indexes for geofence_zones
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_geofence_zones_center_id ON geofence_zones ("centerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_geofence_zones_status ON geofence_zones ("status");
    `);

    // Create location index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_geofence_zones_location ON geofence_zones ("centerLatitude", "centerLongitude");
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE geofence_zones
      ADD CONSTRAINT FK_geofence_zones_center
      FOREIGN KEY ("centerId") REFERENCES healthcare_centers(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE geofence_zones
      ADD CONSTRAINT FK_geofence_zones_created_by
      FOREIGN KEY ("createdBy") REFERENCES users(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE geofence_zones DROP CONSTRAINT IF EXISTS FK_geofence_zones_created_by;`);
    await queryRunner.query(`ALTER TABLE geofence_zones DROP CONSTRAINT IF EXISTS FK_geofence_zones_center;`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_geofence_zones_location;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_geofence_zones_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_geofence_zones_center_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_location_history_timestamp;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_location_history_entity;`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS geofence_zones;`);
    await queryRunner.query(`DROP TABLE IF EXISTS location_history;`);
  }
} 