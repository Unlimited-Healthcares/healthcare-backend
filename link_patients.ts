
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
  
  // 1. Get centers
  const centers = await dataSource.query(`SELECT id, name FROM healthcare_centers`);
  console.log('Centers:', centers);
  
  // 2. Get all patients created recently
  const patients = await dataSource.query(`SELECT id, "patientId", "firstName", "lastName" FROM patients`);
  console.log('Total Patients:', patients.length);

  if (centers.length > 0) {
      const centerId = centers[0].id; // Just use first center for now to ensure visibility
      console.log(`Linking all patients to center ${centers[0].name}...`);
      
      for (const p of patients) {
          await dataSource.query(`
            INSERT INTO patient_provider_relationships (id, patient_id, provider_id, provider_type, status, approved_at, approved_by)
            VALUES (gen_random_uuid(), $1, $2, 'center', 'approved', NOW(), $2)
            ON CONFLICT ("patient_id", "provider_id", "provider_type") DO NOTHING
          `, [p.id, centerId]);
      }
      console.log('Relationships created.');
  }

  await dataSource.destroy();
}

bootstrap();
