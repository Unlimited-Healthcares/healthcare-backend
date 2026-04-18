
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
    
    // 1. Find the user the user mentioned (check column names)
    // Try both naming conventions just in case
    const results = await dataSource.query(`
      SELECT u.id, u.email, u.roles, p."firstName", p."lastName", p."displayName"
      FROM users u 
      LEFT JOIN profiles p ON p."userId" = u.id OR p.user_id = u.id
      WHERE p."displayName" ILIKE '%Iwualasixtus22%' 
         OR p."firstName" ILIKE '%Iwualasixtus22%'
         OR u.email ILIKE '%Iwualasixtus22%'
    `);
    console.log('Found Users:', JSON.stringify(results, null, 2));

    if (results.length > 0) {
      const userId = results[0].id;
      // 2. Check if a Patient record exists for this user
      // Note: in CreateCoreTables migration, it was "userId" (quoted, camelCase)
      const patient = await dataSource.query(`SELECT * FROM patients WHERE "userId" = $1 OR user_id = $1`, [userId]);
      console.log('Linked Patient Record:', JSON.stringify(patient, null, 2));
      
      if (patient.length === 0) {
        console.log('Linking missing patient record...');
        const patientId = 'PT892124634';
        try {
          await dataSource.query(`
            INSERT INTO patients (id, "userId", "patientId", "createdAt", "updatedAt", "isActive")
            VALUES (gen_random_uuid(), $1, $2, NOW(), NOW(), true)
          `, [userId, patientId]);
          console.log('Created patient record for user (camelCase userId).');
        } catch (err) {
            console.log('Retrying with snake_case user_id...');
            await dataSource.query(`
                INSERT INTO patients (id, user_id, "patientId", "createdAt", "updatedAt", "isActive")
                VALUES (gen_random_uuid(), $1, $2, NOW(), NOW(), true)
            `, [userId, patientId]);
            console.log('Created patient record for user (snake_case user_id).');
        }
      }
    }

    // 3. Remove "Anonymous" patients
    console.log('Checking for anonymous patients...');
    // We'll just print them for now to be safe
    const anonymous = await dataSource.query(`
       SELECT id, "patientId" FROM patients 
       WHERE "userId" IS NULL AND (user_id IS NULL OR user_id = ''::uuid)
    `);
    console.log('Found Anonymous Patients:', anonymous.length);
    if (anonymous.length > 0) {
       console.log('Recommended deletion of:', anonymous.map(a => a.patientId));
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

bootstrap();
