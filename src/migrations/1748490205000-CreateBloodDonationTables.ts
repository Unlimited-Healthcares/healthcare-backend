import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBloodDonationTables1748490205000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting CreateBloodDonationTables migration...');

    // Create blood_type enum if it doesn't exist
    console.log('Creating blood_type enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE blood_type_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create donor_status enum if it doesn't exist
    console.log('Creating donor_status enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE donor_status_enum AS ENUM ('eligible', 'ineligible', 'suspended', 'deceased');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create donation_status enum if it doesn't exist
    console.log('Creating donation_status enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE donation_status_enum AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create request_priority enum if it doesn't exist
    console.log('Creating request_priority enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE request_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create request_status enum if it doesn't exist
    console.log('Creating request_status enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'fulfilled', 'cancelled', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create blood_donors table
    console.log('Creating blood_donors table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blood_donors" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "donor_number" VARCHAR UNIQUE NOT NULL,
        "blood_type" blood_type_enum NOT NULL,
        "weight_kg" DECIMAL(5,2) NULL,
        "height_cm" INTEGER NULL,
        "date_of_birth" DATE NOT NULL,
        "emergency_contact_name" VARCHAR NULL,
        "emergency_contact_phone" VARCHAR NULL,
        "medical_conditions" JSONB DEFAULT '[]',
        "medications" JSONB DEFAULT '[]',
        "last_donation_date" TIMESTAMP NULL,
        "next_eligible_date" TIMESTAMP NULL,
        "total_donations" INTEGER DEFAULT 0,
        "total_reward_points" INTEGER DEFAULT 0,
        "status" donor_status_enum DEFAULT 'eligible',
        "notes" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create blood_donation_requests table
    console.log('Creating blood_donation_requests table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blood_donation_requests" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "request_number" VARCHAR UNIQUE NOT NULL,
        "requesting_center_id" UUID NOT NULL,
        "patient_name" VARCHAR NULL,
        "patient_age" INTEGER NULL,
        "blood_type" blood_type_enum NOT NULL,
        "units_needed" INTEGER DEFAULT 1,
        "units_fulfilled" INTEGER DEFAULT 0,
        "priority" request_priority_enum DEFAULT 'medium',
        "status" request_status_enum DEFAULT 'pending',
        "needed_by" TIMESTAMP NOT NULL,
        "medical_condition" TEXT NULL,
        "special_requirements" TEXT NULL,
        "contact_person" VARCHAR NULL,
        "contact_phone" VARCHAR NULL,
        "approved_by" UUID NULL,
        "approved_at" TIMESTAMP NULL,
        "fulfilled_at" TIMESTAMP NULL,
        "notes" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create blood_donations table
    console.log('Creating blood_donations table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blood_donations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "donation_number" VARCHAR UNIQUE NOT NULL,
        "donor_id" UUID NOT NULL,
        "request_id" UUID NULL,
        "blood_bank_center_id" UUID NOT NULL,
        "donation_date" TIMESTAMP DEFAULT now(),
        "blood_type" blood_type_enum NOT NULL,
        "volume_ml" INTEGER DEFAULT 450,
        "status" donation_status_enum DEFAULT 'scheduled',
        "pre_donation_vitals" JSONB NULL,
        "post_donation_vitals" JSONB NULL,
        "pre_screening_results" JSONB NULL,
        "post_donation_monitoring" JSONB NULL,
        "notes" JSONB DEFAULT '{}',
        "staff_notes" TEXT NULL,
        "compensation_amount" DECIMAL(10,2) DEFAULT 0,
        "payment_status" VARCHAR DEFAULT 'pending',
        "payment_reference" VARCHAR NULL,
        "expiry_date" TIMESTAMP NULL,
        "created_by" UUID NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create blood_inventory table
    console.log('Creating blood_inventory table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blood_inventory" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "center_id" UUID NOT NULL,
        "blood_type" blood_type_enum NOT NULL,
        "total_units" INTEGER DEFAULT 0,
        "available_units" INTEGER DEFAULT 0,
        "reserved_units" INTEGER DEFAULT 0,
        "expired_units" INTEGER DEFAULT 0,
        "minimum_threshold" INTEGER DEFAULT 5,
        "last_updated" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create donor_rewards table
    console.log('Creating donor_rewards table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donor_rewards" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "donor_id" UUID NOT NULL,
        "reward_type" VARCHAR NOT NULL,
        "points_earned" INTEGER NOT NULL,
        "description" TEXT NULL,
        "earned_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create donor_verifications table
    console.log('Creating donor_verifications table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donor_verifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "donor_id" UUID NOT NULL,
        "verification_type" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL,
        "verified_by" UUID NULL,
        "verified_at" TIMESTAMP NULL,
        "notes" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create donation_appointments table
    console.log('Creating donation_appointments table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donation_appointments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "donor_id" UUID NOT NULL,
        "center_id" UUID NOT NULL,
        "appointment_date" TIMESTAMP NOT NULL,
        "status" VARCHAR DEFAULT 'scheduled',
        "notes" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraints
    console.log('Adding foreign key constraints...');

    // blood_donors foreign keys
    await queryRunner.query(`
      ALTER TABLE "blood_donors" 
      ADD CONSTRAINT "fk_blood_donors_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // blood_donation_requests foreign keys
    await queryRunner.query(`
      ALTER TABLE "blood_donation_requests" 
      ADD CONSTRAINT "fk_blood_donation_requests_center_id" 
      FOREIGN KEY ("requesting_center_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "blood_donation_requests" 
      ADD CONSTRAINT "fk_blood_donation_requests_approved_by" 
      FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // blood_donations foreign keys
    await queryRunner.query(`
      ALTER TABLE "blood_donations" 
      ADD CONSTRAINT "fk_blood_donations_donor_id" 
      FOREIGN KEY ("donor_id") REFERENCES "blood_donors"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "blood_donations" 
      ADD CONSTRAINT "fk_blood_donations_request_id" 
      FOREIGN KEY ("request_id") REFERENCES "blood_donation_requests"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "blood_donations" 
      ADD CONSTRAINT "fk_blood_donations_center_id" 
      FOREIGN KEY ("blood_bank_center_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "blood_donations" 
      ADD CONSTRAINT "fk_blood_donations_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // blood_inventory foreign keys
    await queryRunner.query(`
      ALTER TABLE "blood_inventory" 
      ADD CONSTRAINT "fk_blood_inventory_center_id" 
      FOREIGN KEY ("center_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE
    `);

    // donor_rewards foreign keys
    await queryRunner.query(`
      ALTER TABLE "donor_rewards" 
      ADD CONSTRAINT "fk_donor_rewards_donor_id" 
      FOREIGN KEY ("donor_id") REFERENCES "blood_donors"("id") ON DELETE CASCADE
    `);

    // donor_verifications foreign keys
    await queryRunner.query(`
      ALTER TABLE "donor_verifications" 
      ADD CONSTRAINT "fk_donor_verifications_donor_id" 
      FOREIGN KEY ("donor_id") REFERENCES "blood_donors"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "donor_verifications" 
      ADD CONSTRAINT "fk_donor_verifications_verified_by" 
      FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // donation_appointments foreign keys
    await queryRunner.query(`
      ALTER TABLE "donation_appointments" 
      ADD CONSTRAINT "fk_donation_appointments_donor_id" 
      FOREIGN KEY ("donor_id") REFERENCES "blood_donors"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "donation_appointments" 
      ADD CONSTRAINT "fk_donation_appointments_center_id" 
      FOREIGN KEY ("center_id") REFERENCES "healthcare_centers"("id") ON DELETE CASCADE
    `);

    console.log('Blood donation tables created successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back CreateBloodDonationTables migration...');

    // Drop foreign key constraints first
    await queryRunner.query(`ALTER TABLE "donation_appointments" DROP CONSTRAINT IF EXISTS "fk_donation_appointments_center_id"`);
    await queryRunner.query(`ALTER TABLE "donation_appointments" DROP CONSTRAINT IF EXISTS "fk_donation_appointments_donor_id"`);
    await queryRunner.query(`ALTER TABLE "donor_verifications" DROP CONSTRAINT IF EXISTS "fk_donor_verifications_verified_by"`);
    await queryRunner.query(`ALTER TABLE "donor_verifications" DROP CONSTRAINT IF EXISTS "fk_donor_verifications_donor_id"`);
    await queryRunner.query(`ALTER TABLE "donor_rewards" DROP CONSTRAINT IF EXISTS "fk_donor_rewards_donor_id"`);
    await queryRunner.query(`ALTER TABLE "blood_inventory" DROP CONSTRAINT IF EXISTS "fk_blood_inventory_center_id"`);
    await queryRunner.query(`ALTER TABLE "blood_donations" DROP CONSTRAINT IF EXISTS "fk_blood_donations_created_by"`);
    await queryRunner.query(`ALTER TABLE "blood_donations" DROP CONSTRAINT IF EXISTS "fk_blood_donations_center_id"`);
    await queryRunner.query(`ALTER TABLE "blood_donations" DROP CONSTRAINT IF EXISTS "fk_blood_donations_request_id"`);
    await queryRunner.query(`ALTER TABLE "blood_donations" DROP CONSTRAINT IF EXISTS "fk_blood_donations_donor_id"`);
    await queryRunner.query(`ALTER TABLE "blood_donation_requests" DROP CONSTRAINT IF EXISTS "fk_blood_donation_requests_approved_by"`);
    await queryRunner.query(`ALTER TABLE "blood_donation_requests" DROP CONSTRAINT IF EXISTS "fk_blood_donation_requests_center_id"`);
    await queryRunner.query(`ALTER TABLE "blood_donors" DROP CONSTRAINT IF EXISTS "fk_blood_donors_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "donation_appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "donor_verifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "donor_rewards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_inventory"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_donations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_donation_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_donors"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "request_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "request_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "donation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "donor_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_type_enum"`);

    console.log('Blood donation tables dropped successfully!');
  }
} 