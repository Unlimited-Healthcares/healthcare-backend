
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
  await dataSource.initialize();
  const patients = await dataSource.query(`SELECT "patientId", "firstName", "lastName", "userId" FROM patients`);
  console.log('Final Patient List:', JSON.stringify(patients, null, 2));
  await dataSource.destroy();
}

bootstrap();
