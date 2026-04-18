
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
  const centers = await dataSource.query(`SELECT id FROM healthcare_centers`);
  const patients = await dataSource.query(`SELECT id FROM patients`);
  
  for (const c of centers) {
    for (const p of patients) {
      await dataSource.query(`
        INSERT INTO patient_provider_relationships (id, patient_id, provider_id, provider_type, status, approved_at, approved_by)
        VALUES (gen_random_uuid(), $1, $2, 'center', 'approved', NOW(), $2)
        ON CONFLICT (patient_id, provider_id, provider_type) DO NOTHING
      `, [p.id, c.id]);
    }
  }
  console.log('All patients linked to all centers.');
  await dataSource.destroy();
}

bootstrap();
