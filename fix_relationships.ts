
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
  
  // 1. Get current centers and their creators
  const centers = await dataSource.query(`SELECT id, name, "createdBy" FROM healthcare_centers`);
  console.log('Centers:', JSON.stringify(centers, null, 2));
  
  // 2. Get the user "Iwualasixtus22"
  const users = await dataSource.query(`
    SELECT u.id, u.email, p."displayName" 
    FROM users u 
    LEFT JOIN profiles p ON p."userId" = u.id
    WHERE p."displayName" ILIKE '%Iwualasixtus22%'
  `);
  console.log('Iwuala User:', users);

  if (users.length > 0 && centers.length > 0) {
      const iwualaUserId = users[0].id;
      // Is this user a creator of any center?
      const myCenter = centers.find(c => c.createdBy === iwualaUserId);
      if (myCenter) {
          console.log(`User is the creator of center: ${myCenter.name}`);
          // Link all patients to THIS center
          const patients = await dataSource.query(`SELECT id FROM patients`);
          for (const p of patients) {
              await dataSource.query(`
                INSERT INTO patient_provider_relationships (id, patient_id, provider_id, provider_type, status, approved_at, approved_by)
                VALUES (gen_random_uuid(), $1, $2, 'center', 'approved', NOW(), $2)
                ON CONFLICT (patient_id, provider_id, provider_type) DO NOTHING
              `, [p.id, myCenter.id]);
          }
          console.log('Linked all patients to user center.');
      } else {
          console.log('User is NOT the creator of any center. Linking to ALL centers for testing...');
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
      }
  }

  await dataSource.destroy();
}

bootstrap();
