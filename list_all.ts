
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
  const profiles = await dataSource.query(`SELECT * FROM profiles`);
  console.log('--- ALL PROFILES ---');
  profiles.forEach(p => console.log(JSON.stringify(p)));
  
  const users = await dataSource.query(`SELECT * FROM users`);
  console.log('--- ALL USERS ---');
  users.forEach(u => console.log(JSON.stringify(u)));

  await dataSource.destroy();
}

bootstrap();
