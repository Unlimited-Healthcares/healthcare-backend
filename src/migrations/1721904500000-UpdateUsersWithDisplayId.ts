import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersWithDisplayId1721904500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting UpdateUsersWithDisplayId migration...');

    try {
      // First, check if users table exists
      console.log('Checking if users table exists...');
      const hasUsersTable = await queryRunner.hasTable('users');

      if (!hasUsersTable) {
        console.log('Users table does not exist. Creating it...');
        // Create the users table with basic structure including the displayId column
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            "displayId" VARCHAR UNIQUE NULL,
            email VARCHAR UNIQUE NOT NULL,
            password VARCHAR NOT NULL,
            roles TEXT NOT NULL,
            "refreshToken" VARCHAR NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
          )
        `);
        console.log('Users table created successfully.');
        return; // No need to continue if we just created the table
      }

      // Check if the displayId column exists, if not, add it
      console.log('Checking if displayId column exists...');
      const tableColumns = await queryRunner.getTable('users');
      const displayIdColumn = tableColumns.findColumnByName('displayId');

      if (!displayIdColumn) {
        console.log('displayId column does not exist. Adding it...');
        // Add the displayId column if it doesn't exist
        await queryRunner.query(`
          ALTER TABLE users ADD COLUMN "displayId" VARCHAR UNIQUE NULL
        `);
        console.log('displayId column added successfully.');
      } else {
        console.log('displayId column already exists.');
      }

      // Now get all users that have null displayId
      console.log('Fetching users with null displayId...');
      const users = await queryRunner.query(`
        SELECT id, roles FROM users WHERE "displayId" IS NULL
      `);
      console.log(`Found ${users.length} users with null displayId.`);

      // Update each user with a generated displayId
      for (const user of users) {
        console.log(`Processing user with ID: ${user.id}, roles: ${JSON.stringify(user.roles)}`);
        let primaryRole = 'patient';

        // Handle different possible formats of roles in the database
        if (user.roles) {
          if (Array.isArray(user.roles)) {
            primaryRole = user.roles[0] || 'patient';
          } else if (typeof user.roles === 'string') {
            // Handle both comma-separated strings and single values
            primaryRole = user.roles.includes(',') ? user.roles.split(',')[0] : user.roles;
          }
        }

        console.log(`Determined primary role as: ${primaryRole}`);

        // Generate a display ID based on role
        const prefix = this.getPrefixForRole(primaryRole);
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const displayId = `${prefix}${timestamp}${random}`;

        console.log(`Generated displayId: ${displayId}`);

        // Update the user
        await queryRunner.query(`
          UPDATE users 
          SET "displayId" = '${displayId}' 
          WHERE id = '${user.id}'
        `);

        console.log(`Updated user ${user.id} with displayId ${displayId}`);

        // Small delay to ensure unique timestamp
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      console.log('Migration completed successfully.');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Running down migration...');
    try {
      // Check if the table exists before attempting to modify it
      const hasUsersTable = await queryRunner.hasTable('users');
      if (!hasUsersTable) {
        console.log('Users table does not exist. Nothing to do.');
        return;
      }

      // This migration is non-reversible, but we can attempt to remove the column
      await queryRunner.query(`
        ALTER TABLE users DROP COLUMN IF EXISTS "displayId"
      `);
      console.log('displayId column removed successfully.');
    } catch (error) {
      console.error('Error during down migration:', error);
      throw error;
    }
  }

  private getPrefixForRole(role: string): string {
    const prefixes = {
      patient: 'PT',
      doctor: 'DR',
      facility: 'FC',
      admin: 'AD',
    };

    return prefixes[(role || '').toLowerCase()] || 'USR';
  }
} 