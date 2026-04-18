
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.development') });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function bootstrap() {
  try {
    await dataSource.initialize();
    console.log('--- DB CONNECTED ---');
    
    // Check tables
    const tables = await dataSource.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables:', tables.map(t => t.table_name));

    // Guess column names for profiles
    const profCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`);
    console.log('Profiles columns:', profCols.map(c => c.column_name));

    const patCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`);
    console.log('Patients columns:', patCols.map(c => c.column_name));

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

bootstrap();
