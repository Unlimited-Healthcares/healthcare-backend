import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevokeFieldsToShares1721904800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting AddRevokeFieldsToShares migration...');
    
    // First, check if medical_record_shares table exists
    console.log('Checking if medical_record_shares table exists...');
    const hasSharesTable = await queryRunner.hasTable('medical_record_shares');
    
    if (!hasSharesTable) {
      console.log('Medical record shares table does not exist. This migration requires the table to exist.');
      throw new Error('medical_record_shares table must exist before running this migration. Please ensure previous migrations have run successfully.');
    }
    
    console.log('Medical record shares table exists. Adding revoke fields...');
    // Add revoke fields to existing medical_record_shares table
    await queryRunner.query(`
      ALTER TABLE medical_record_shares 
      ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "revokedBy" UUID
    `);
    console.log('Revoke fields added successfully.');
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
      
      // Remove the revoke fields if needed to rollback
      await queryRunner.query(`
        ALTER TABLE medical_record_shares 
        DROP COLUMN IF EXISTS "revokedAt",
        DROP COLUMN IF EXISTS "revokedBy"
      `);
      console.log('Revoke fields removed successfully.');
    } catch (error) {
      console.error('Error during down migration:', error);
      throw error;
    }
  }
} 