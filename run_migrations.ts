import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { dataSourceOptions } from './src/datasource';

async function runMigrations() {
  const ds = new DataSource({
    ...dataSourceOptions,
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
  } as any);

  try {
    await ds.initialize();
    console.log('✅ Connected to database. Running migrations...');
    const migrations = await ds.runMigrations();
    if (migrations.length > 0) {
      console.log(`✅ Successfully ran ${migrations.length} migrations.`);
    } else {
      console.log('ℹ️ No pending migrations found. Database is up to date.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
    }
  }
}

runMigrations();
