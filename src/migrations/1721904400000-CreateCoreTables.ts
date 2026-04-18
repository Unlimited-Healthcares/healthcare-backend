import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1721904400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting CreateCoreTables migration...');

    // Enable uuid-ossp extension
    console.log('Enabling uuid-ossp extension...');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create patients table if it doesn't exist
    console.log('Creating patients table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        "patientId" VARCHAR UNIQUE NOT NULL,
        "medicalRecordNumber" VARCHAR UNIQUE NULL,
        "emergencyContactName" VARCHAR NULL,
        "emergencyContactPhone" VARCHAR NULL,
        "emergencyContactRelationship" VARCHAR NULL,
        "bloodType" VARCHAR(5) NULL,
        allergies TEXT NULL,
        "chronicConditions" TEXT NULL,
        "currentMedications" TEXT NULL,
        "insuranceProvider" VARCHAR NULL,
        "insurancePolicyNumber" VARCHAR NULL,
        "preferredLanguage" VARCHAR DEFAULT 'English',
        "consentDataSharing" BOOLEAN DEFAULT false,
        "consentResearch" BOOLEAN DEFAULT false,
        "consentMarketing" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create healthcare_centers table if it doesn't exist
    console.log('Creating healthcare_centers table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS healthcare_centers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        "centerType" VARCHAR(100) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        "postalCode" VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Nigeria',
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        description TEXT,
        "operatingHours" JSONB,
        services JSONB,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        "practiceNumber" VARCHAR(100),
        "practiceExpiry" DATE,
        "isActive" BOOLEAN DEFAULT true,
        "isVerified" BOOLEAN DEFAULT false,
        logo TEXT,
        images TEXT[],
        "createdBy" UUID,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create patient_visits table if it doesn't exist
    console.log('Creating patient_visits table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS patient_visits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patientId" UUID NOT NULL,
        "centerId" UUID NOT NULL,
        "visitDate" TIMESTAMP NOT NULL,
        "visitType" VARCHAR NOT NULL,
        "chiefComplaint" TEXT NULL,
        diagnosis TEXT NULL,
        "treatmentNotes" TEXT NULL,
        "prescribedMedications" TEXT NULL,
        "followUpRequired" BOOLEAN DEFAULT false,
        "followUpDate" TIMESTAMP NULL,
        "visitStatus" VARCHAR DEFAULT 'completed',
        "createdBy" UUID NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create medical_record_files table if it doesn't exist
    console.log('Creating medical_record_files table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS medical_record_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recordId" UUID NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "originalFileName" VARCHAR(255) NOT NULL,
        "filePath" VARCHAR(500) NOT NULL,
        "fileType" VARCHAR(100) NOT NULL,
        "fileSize" BIGINT NOT NULL,
        "mimeType" VARCHAR(100) NULL,
        "isEncrypted" BOOLEAN DEFAULT true,
        "encryptionKeyId" VARCHAR(255) NULL,
        "thumbnailPath" VARCHAR(500) NULL,
        metadata JSONB NULL,
        "uploadStatus" VARCHAR(50) DEFAULT 'completed',
        "createdBy" UUID NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create medical_record_categories table if it doesn't exist
    console.log('Creating medical_record_categories table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS medical_record_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NULL,
        "parentCategoryId" UUID NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create medical_record_versions table if it doesn't exist
    console.log('Creating medical_record_versions table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS medical_record_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recordId" UUID NOT NULL,
        "versionNumber" INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT NULL,
        "recordType" VARCHAR NOT NULL,
        "previousData" JSONB NOT NULL,
        "changesSummary" TEXT NULL,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create medical_record_access_log table if it doesn't exist
    console.log('Creating medical_record_access_log table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS medical_record_access_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recordId" UUID NOT NULL,
        "shareId" UUID NULL,
        "accessedBy" UUID NULL,
        "accessType" VARCHAR(50) NOT NULL,
        "accessDetails" JSONB NULL,
        "ipAddress" INET NULL,
        "userAgent" TEXT NULL,
        "sessionId" VARCHAR(255) NULL,
        "accessedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create medical_record_share_requests table if it doesn't exist
    console.log('Creating medical_record_share_requests table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS medical_record_share_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recordId" UUID NOT NULL,
        "patientId" UUID NOT NULL,
        "requestingCenterId" UUID NOT NULL,
        "owningCenterId" UUID NOT NULL,
        "requestedBy" UUID NULL,
        purpose TEXT NOT NULL,
        "urgencyLevel" VARCHAR(50) DEFAULT 'normal',
        "requestStatus" VARCHAR(50) DEFAULT 'pending',
        "requestedAccessLevel" VARCHAR(50) DEFAULT 'view',
        "requestedDurationDays" INTEGER DEFAULT 30,
        "responseNotes" TEXT NULL,
        "approvedBy" UUID NULL,
        "respondedAt" TIMESTAMP NULL,
        "expiresAt" TIMESTAMP NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    console.log('✅ Core tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Running down migration - removing core tables...');

    // Drop tables in reverse order to avoid foreign key issues
    await queryRunner.query(`DROP TABLE IF EXISTS medical_record_share_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_record_access_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_record_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_record_categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_record_files`);
    await queryRunner.query(`DROP TABLE IF EXISTS patient_visits`);
    await queryRunner.query(`DROP TABLE IF EXISTS healthcare_centers`);
    await queryRunner.query(`DROP TABLE IF EXISTS patients`);

    console.log('✅ Core tables removed successfully');
  }
} 