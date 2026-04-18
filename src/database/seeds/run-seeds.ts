import dataSource from '../../datasource';
import { seedAmbulances } from './ambulance-seed';
import { seedAdmin } from './admin-seed';
import { seedSystemConfig } from './system-config-seed';


/**
 * Database Seeder
 * Runs seed scripts to populate the database with initial data
 */
async function runSeeds(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize the data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    console.log('✅ Database connection established');

    // Run seed functions
    await seedAdmin(dataSource);
    await seedSystemConfig(dataSource);
    await seedAmbulances(dataSource);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds }; 