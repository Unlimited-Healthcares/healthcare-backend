import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function checkTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await dataSource.initialize();
    console.log('Connected to database');
    const tables = ['care_tasks', 'prescriptions', 'encounters', 'audit_logs'];
    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      console.log(`Table ${table}: ${result[0].exists ? 'EXISTS' : 'MISSING'}`);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkTables();
