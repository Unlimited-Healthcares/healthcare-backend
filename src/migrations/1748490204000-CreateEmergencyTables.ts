
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmergencyTables1748490204000 implements MigrationInterface {
  name = 'CreateEmergencyTables1748490204000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ambulances table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ambulances" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "vehicle_number" VARCHAR(50) UNIQUE NOT NULL,
        "license_plate" VARCHAR(20) UNIQUE NOT NULL,
        "type" VARCHAR(20) DEFAULT 'basic' CHECK ("type" IN ('basic', 'advanced', 'critical_care', 'neonatal')),
        "status" VARCHAR(20) DEFAULT 'available' CHECK ("status" IN ('available', 'dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'out_of_service')),
        "current_latitude" DECIMAL(10,8),
        "current_longitude" DECIMAL(11,8),
        "last_location_update" TIMESTAMP WITH TIME ZONE,
        "crew_members" JSONB,
        "equipment_list" JSONB,
        "base_station_id" VARCHAR(50),
        "contact_number" VARCHAR(20) NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "last_maintenance" TIMESTAMP WITH TIME ZONE,
        "next_maintenance" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ambulance_requests table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ambulance_requests" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "request_number" VARCHAR(50) UNIQUE NOT NULL,
        "patient_name" VARCHAR(100) NOT NULL,
        "patient_age" INTEGER,
        "patient_gender" VARCHAR(20),
        "patient_phone" VARCHAR(20) NOT NULL,
        "emergency_contact_name" VARCHAR(100),
        "emergency_contact_phone" VARCHAR(20),
        "pickup_latitude" DECIMAL(10,8) NOT NULL,
        "pickup_longitude" DECIMAL(11,8) NOT NULL,
        "pickup_address" TEXT NOT NULL,
        "destination_latitude" DECIMAL(10,8),
        "destination_longitude" DECIMAL(11,8),
        "destination_address" TEXT,
        "medical_condition" TEXT NOT NULL,
        "symptoms" TEXT,
        "priority" VARCHAR(20) DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high', 'critical')),
        "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'dispatched', 'acknowledged', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled')),
        "special_requirements" TEXT,
        "medical_history" JSONB,
        "requested_by" UUID NOT NULL,
        "ambulance_id" UUID,
        "dispatched_at" TIMESTAMP WITH TIME ZONE,
        "acknowledged_at" TIMESTAMP WITH TIME ZONE,
        "arrived_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "estimated_arrival" TIMESTAMP WITH TIME ZONE,
        "actual_arrival" TIMESTAMP WITH TIME ZONE,
        "total_cost" DECIMAL(10,2),
        "insurance_info" JSONB,
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create emergency_alerts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emergency_alerts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "alert_number" VARCHAR(50) UNIQUE NOT NULL,
        "type" VARCHAR(30) NOT NULL CHECK ("type" IN ('sos', 'medical_emergency', 'accident', 'fire', 'natural_disaster', 'security_threat', 'panic')),
        "status" VARCHAR(20) DEFAULT 'active' CHECK ("status" IN ('active', 'acknowledged', 'responding', 'resolved', 'false_alarm', 'cancelled')),
        "user_id" UUID NOT NULL,
        "patient_id" UUID,
        "description" TEXT,
        "latitude" DECIMAL(10,8) NOT NULL,
        "longitude" DECIMAL(11,8) NOT NULL,
        "address" TEXT,
        "contact_number" VARCHAR(20) NOT NULL,
        "emergency_contacts" JSONB,
        "medical_info" JSONB,
        "responder_ids" JSONB,
        "acknowledged_at" TIMESTAMP WITH TIME ZONE,
        "acknowledged_by" UUID,
        "response_time_minutes" INTEGER,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "resolved_by" UUID,
        "resolution_notes" TEXT,
        "is_test_alert" BOOLEAN DEFAULT false,
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create emergency_contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emergency_contacts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "contact_name" VARCHAR(100) NOT NULL,
        "contact_phone" VARCHAR(20) NOT NULL,
        "contact_email" VARCHAR(100),
        "relationship" VARCHAR(50) NOT NULL,
        "is_primary" BOOLEAN DEFAULT false,
        "is_medical_contact" BOOLEAN DEFAULT false,
        "contact_address" TEXT,
        "notes" TEXT,
        "notification_preferences" JSONB,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create viral_reports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "viral_reports" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "report_number" VARCHAR(50) UNIQUE NOT NULL,
        "type" VARCHAR(30) NOT NULL CHECK ("type" IN ('outbreak_report', 'exposure_report', 'symptom_report', 'contact_trace', 'recovery_report')),
        "status" VARCHAR(20) DEFAULT 'submitted' CHECK ("status" IN ('submitted', 'under_review', 'verified', 'investigated', 'closed', 'dismissed')),
        "reported_by" UUID,
        "is_anonymous" BOOLEAN DEFAULT false,
        "disease_type" VARCHAR(100) NOT NULL,
        "symptoms" JSONB NOT NULL,
        "onset_date" TIMESTAMP WITH TIME ZONE,
        "exposure_date" TIMESTAMP WITH TIME ZONE,
        "location_latitude" DECIMAL(10,8),
        "location_longitude" DECIMAL(11,8),
        "location_address" TEXT,
        "contact_information" JSONB,
        "affected_count" INTEGER DEFAULT 1,
        "description" TEXT,
        "risk_factors" JSONB,
        "preventive_measures" JSONB,
        "healthcare_facility_visited" VARCHAR(200),
        "test_results" JSONB,
        "health_authority_notified" BOOLEAN DEFAULT false,
        "notification_sent_at" TIMESTAMP WITH TIME ZONE,
        "investigated_by" UUID,
        "investigation_notes" TEXT,
        "public_health_actions" JSONB,
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create contact_traces table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_traces" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "viral_report_id" UUID NOT NULL,
        "contact_name" VARCHAR(100),
        "contact_phone" VARCHAR(20),
        "contact_email" VARCHAR(100),
        "contact_type" VARCHAR(20) NOT NULL CHECK ("contact_type" IN ('household', 'workplace', 'social', 'healthcare', 'travel', 'other')),
        "exposure_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "exposure_duration_minutes" INTEGER,
        "risk_level" VARCHAR(20) DEFAULT 'moderate' CHECK ("risk_level" IN ('low', 'moderate', 'high', 'very_high')),
        "exposure_location" TEXT,
        "exposure_details" TEXT,
        "mask_worn_by_case" BOOLEAN,
        "mask_worn_by_contact" BOOLEAN,
        "outdoor_exposure" BOOLEAN,
        "notified_at" TIMESTAMP WITH TIME ZONE,
        "quarantine_start_date" TIMESTAMP WITH TIME ZONE,
        "quarantine_end_date" TIMESTAMP WITH TIME ZONE,
        "test_recommended" BOOLEAN DEFAULT true,
        "test_scheduled_date" TIMESTAMP WITH TIME ZONE,
        "follow_up_required" BOOLEAN DEFAULT true,
        "follow_up_completed" BOOLEAN DEFAULT false,
        "notes" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulances_status" ON "ambulances" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulances_location" ON "ambulances" ("current_latitude", "current_longitude");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_requests_status" ON "ambulance_requests" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_requests_priority" ON "ambulance_requests" ("priority");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_requests_location" ON "ambulance_requests" ("pickup_latitude", "pickup_longitude");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_alerts_status" ON "emergency_alerts" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_alerts_user" ON "emergency_alerts" ("user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_alerts_location" ON "emergency_alerts" ("latitude", "longitude");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_contacts_user" ON "emergency_contacts" ("user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_viral_reports_status" ON "viral_reports" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_viral_reports_disease" ON "viral_reports" ("disease_type");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_viral_reports_location" ON "viral_reports" ("location_latitude", "location_longitude");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contact_traces_report" ON "contact_traces" ("viral_report_id");`);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "ambulance_requests"
      ADD CONSTRAINT "FK_ambulance_requests_ambulance"
      FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // Cleanup orphaned records that would violate foreign key constraints
    await queryRunner.query(`DELETE FROM "ambulance_requests" WHERE "requested_by"::text NOT IN (SELECT id::text FROM users)`);

    // Ensure column types are correct before adding constraints (handles cases where tables pre-existed with different types)
    await queryRunner.query(`
      ALTER TABLE "ambulance_requests" 
      ALTER COLUMN "requested_by" TYPE UUID USING "requested_by"::UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE "ambulance_requests"
      ADD CONSTRAINT "FK_ambulance_requests_user"
      FOREIGN KEY ("requested_by") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await queryRunner.query(`DELETE FROM "emergency_alerts" WHERE "user_id"::text NOT IN (SELECT id::text FROM users)`);

    await queryRunner.query(`
      ALTER TABLE "emergency_alerts" 
      ALTER COLUMN "user_id" TYPE UUID USING "user_id"::UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE "emergency_alerts"
      ADD CONSTRAINT "FK_emergency_alerts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await queryRunner.query(`DELETE FROM "emergency_contacts" WHERE "user_id"::text NOT IN (SELECT id::text FROM users)`);

    await queryRunner.query(`
      ALTER TABLE "emergency_contacts" 
      ALTER COLUMN "user_id" TYPE UUID USING "user_id"::UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE "emergency_contacts"
      ADD CONSTRAINT "FK_emergency_contacts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    // For nullable columns, we set to NULL instead of deleting
    await queryRunner.query(`UPDATE "viral_reports" SET "reported_by" = NULL WHERE "reported_by"::text NOT IN (SELECT id::text FROM users)`);

    await queryRunner.query(`
      ALTER TABLE "viral_reports" 
      ALTER COLUMN "reported_by" TYPE UUID USING "reported_by"::UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE "viral_reports"
      ADD CONSTRAINT "FK_viral_reports_user"
      FOREIGN KEY ("reported_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "contact_traces"
      ADD CONSTRAINT "FK_contact_traces_report"
      FOREIGN KEY ("viral_report_id") REFERENCES "viral_reports"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "contact_traces" DROP CONSTRAINT IF EXISTS "FK_contact_traces_report";`);
    await queryRunner.query(`ALTER TABLE "viral_reports" DROP CONSTRAINT IF EXISTS "FK_viral_reports_user";`);
    await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP CONSTRAINT IF EXISTS "FK_emergency_contacts_user";`);
    await queryRunner.query(`ALTER TABLE "emergency_alerts" DROP CONSTRAINT IF EXISTS "FK_emergency_alerts_user";`);
    await queryRunner.query(`ALTER TABLE "ambulance_requests" DROP CONSTRAINT IF EXISTS "FK_ambulance_requests_user";`);
    await queryRunner.query(`ALTER TABLE "ambulance_requests" DROP CONSTRAINT IF EXISTS "FK_ambulance_requests_ambulance";`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_traces_report";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_viral_reports_location";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_viral_reports_disease";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_viral_reports_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_contacts_user";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_alerts_location";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_alerts_user";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_alerts_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulance_requests_location";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulance_requests_priority";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulance_requests_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulances_location";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulances_status";`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_traces";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "viral_reports";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emergency_contacts";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emergency_alerts";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ambulance_requests";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ambulances";`);
  }
}
