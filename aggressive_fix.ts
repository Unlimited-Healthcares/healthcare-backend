
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
  console.log('--- DB CONNECTED ---');
  
  // 1. Sync names from profiles to patients for linked records
  console.log('Syncing names for linked patients...');
  await dataSource.query(`
    UPDATE patients p
    SET "firstName" = prof."firstName",
        "lastName" = prof."lastName"
    FROM profiles prof
    WHERE p."userId" = prof."userId"
    AND (p."firstName" IS NULL OR p."firstName" = '')
    AND (prof."firstName" IS NOT NULL AND prof."firstName" != '')
  `);
  console.log('Linked patients synced.');

  // 2. Create missing clinical patient records for ANY user with role 'patient'
  console.log('Creating clinical records for patient accounts...');
  const missing = await dataSource.query(`
    INSERT INTO patients (id, "userId", "patientId", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(), 
        u.id, 
        'PT' || EXTRACT(EPOCH FROM NOW())::bigint || LPAD(ROW_NUMBER() OVER ()::text, 4, '0'),
        prof."firstName", 
        prof."lastName", 
        true, 
        NOW(), 
        NOW()
    FROM users u
    INNER JOIN profiles prof ON prof."userId" = u.id
    WHERE u.roles LIKE '%patient%'
    AND NOT EXISTS (SELECT 1 FROM patients p WHERE p."userId" = u.id)
  `);
  console.log('Clinical records created.');

  // 3. Delete ANY anonymous mock data (no user, no name)
  console.log('Deleting anonymous mock patients...');
  await dataSource.query(`
    DELETE FROM patients 
    WHERE "userId" IS NULL 
    AND ("firstName" IS NULL OR p."firstName" = '')
    AND "patientId" NOT LIKE 'PT892124634'
  `).catch(() => {});

  await dataSource.destroy();
}

bootstrap();
