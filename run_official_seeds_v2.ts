import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { dataSourceOptions } from './src/datasource';
import { seedAdmin } from './src/database/seeds/admin-seed';
import { seedSystemConfig } from './src/database/seeds/system-config-seed';
import { seedAmbulances } from './src/database/seeds/ambulance-seed';

async function runOfficialSeeds() {
  const ds = new DataSource({
    ...dataSourceOptions,
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    entities: ['src/**/*.entity.ts'],
  } as any);

  try {
    await ds.initialize();
    console.log('✅ Connected. Running official seeds...');
    
    await seedAdmin(ds);
    console.log('✅ Admin seed complete');
    
    await seedSystemConfig(ds);
    console.log('✅ System config seed complete');
    
    await seedAmbulances(ds);
    console.log('✅ Ambulance seed complete');

    console.log('✨ All official seeds completed successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
    }
  }
}

runOfficialSeeds();
