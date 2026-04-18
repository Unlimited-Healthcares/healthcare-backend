
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.development') });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/healthcare',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function bootstrap() {
  try {
    await dataSource.initialize();
    console.log('--- DB CONNECTED ---');
    
    // Check if columns exist
    const hasColumns = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' AND column_name IN ('firstName', 'lastName', 'email', 'phone', 'vitals')
    `);
    console.log('Identity columns in patients table:', hasColumns.map(c => c.column_name));
    
    // Find the specific patient the user mentioned
    const patientMentioned = await dataSource.query(`SELECT * FROM patients WHERE "patientId" = 'PT892124634'`);
    console.log('Patient record PT892124634:', patientMentioned);
    
    // Find users with patient role
    const patientUsers = await dataSource.query(`SELECT u.id, u.email, u.roles, u.displayId, p."firstName", p."lastName" FROM users u LEFT JOIN profiles p ON p."userId" = u.id WHERE u.roles LIKE '%patient%'`);
    console.log('Recent Patient Users:', patientUsers);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

bootstrap();
