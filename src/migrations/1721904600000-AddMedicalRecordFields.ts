import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicalRecordFields1721904600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting AddMedicalRecordFields migration...');
    
    // First, check if medical_records table exists
    console.log('Checking if medical_records table exists...');
    const hasMedicalRecordsTable = await queryRunner.hasTable('medical_records');
    
    if (!hasMedicalRecordsTable) {
      console.log('Medical records table does not exist. Creating it...');
      // Create the medical_records table with all required columns based on the entity
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "patientId" UUID NOT NULL,
          "centerId" UUID NULL,
          "createdBy" UUID NULL,
          "recordType" VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          "recordData" JSONB NULL,
          tags TEXT[] NULL,
          category VARCHAR(100) NULL,
          diagnosis TEXT NULL,
          treatment TEXT NULL,
          notes TEXT NULL,
          "followUp" TEXT NULL,
          medications JSONB NULL,
          status VARCHAR(50) DEFAULT 'active',
          version INTEGER DEFAULT 1,
          "parentRecordId" UUID NULL,
          "isSensitive" BOOLEAN DEFAULT false,
          "isShareable" BOOLEAN DEFAULT true,
          "sharingRestrictions" JSONB NULL,
          "fileAttachments" TEXT[] NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      console.log('Medical records table created successfully.');
    } else {
      console.log('Medical records table exists. Adding missing columns...');
      // Add new columns to existing medical_records table
      await queryRunner.query(`
        ALTER TABLE medical_records
        ADD COLUMN IF NOT EXISTS diagnosis TEXT,
        ADD COLUMN IF NOT EXISTS treatment TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS "followUp" TEXT,
        ADD COLUMN IF NOT EXISTS medications JSONB
      `);
      console.log('Additional columns added successfully.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Running down migration...');
    try {
      // Check if the table exists before attempting to modify it
      const hasMedicalRecordsTable = await queryRunner.hasTable('medical_records');
      if (!hasMedicalRecordsTable) {
        console.log('Medical records table does not exist. Nothing to do.');
        return;
      }
      
      // Remove the columns if needed to rollback (only remove the ones we might have added)
      await queryRunner.query(`
        ALTER TABLE medical_records
        DROP COLUMN IF EXISTS diagnosis,
        DROP COLUMN IF EXISTS treatment,
        DROP COLUMN IF EXISTS notes,
        DROP COLUMN IF EXISTS "followUp",
        DROP COLUMN IF EXISTS medications
      `);
      console.log('Additional columns removed successfully.');
    } catch (error) {
      console.error('Error during down migration:', error);
      throw error;
    }
  }
} 