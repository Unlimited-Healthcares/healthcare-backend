import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactPersonToShares1721904700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting AddContactPersonToShares migration...');
    
    // First, check if medical_record_shares table exists
    console.log('Checking if medical_record_shares table exists...');
    const hasSharesTable = await queryRunner.hasTable('medical_record_shares');
    
    if (!hasSharesTable) {
      console.log('Medical record shares table does not exist. Creating it...');
      // Create the medical_record_shares table with all required columns based on the entity
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS medical_record_shares (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "recordId" UUID NOT NULL,
          "patientId" UUID NOT NULL,
          "fromCenterId" UUID NOT NULL,
          "toCenterId" UUID NOT NULL,
          "sharedBy" UUID NULL,
          "shareType" VARCHAR(50) DEFAULT 'temporary',
          "accessLevel" VARCHAR(50) DEFAULT 'view',
          "expiryDate" TIMESTAMP NULL,
          "isActive" BOOLEAN DEFAULT true,
          "accessConditions" JSONB NULL,
          "sharedDataScope" JSONB NULL,
          "contactPerson" VARCHAR(255) NULL,
          "revokedAt" TIMESTAMP NULL,
          "revokedBy" UUID NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      console.log('Medical record shares table created successfully.');
    } else {
      console.log('Medical record shares table exists. Adding contactPerson column...');
      // Add contactPerson column to existing medical_record_shares table
      await queryRunner.query(`
        ALTER TABLE medical_record_shares
        ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(255)
      `);
      console.log('ContactPerson column added successfully.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Running down migration...');
    try {
      // Check if the table exists before attempting to modify it
      const hasSharesTable = await queryRunner.hasTable('medical_record_shares');
      if (!hasSharesTable) {
        console.log('Medical record shares table does not exist. Nothing to do.');
        return;
      }
      
      // Remove the contactPerson column if needed to rollback
      await queryRunner.query(`
        ALTER TABLE medical_record_shares
        DROP COLUMN IF EXISTS "contactPerson"
      `);
      console.log('ContactPerson column removed successfully.');
    } catch (error) {
      console.error('Error during down migration:', error);
      throw error;
    }
  }
} 