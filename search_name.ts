
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
  const search = 'Iwuala';
  const profiles = await dataSource.query(`SELECT * FROM profiles WHERE "displayName" ILIKE '%${search}%' OR "firstName" ILIKE '%${search}%' OR "lastName" ILIKE '%${search}%'`);
  console.log('Search Result:', JSON.stringify(profiles, null, 2));
  await dataSource.destroy();
}

bootstrap();
