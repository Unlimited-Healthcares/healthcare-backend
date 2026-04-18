
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
  
  // 1. Get ALL profiles and filter manually
  const profiles = await dataSource.query(`SELECT * FROM profiles`);
  console.log(`Analyzing ${profiles.length} profiles...`);
  
  const targetProfile = profiles.find(p => (p.displayName || '').includes('Iwualasixtus22'));
  if (targetProfile) {
      console.log('Target Profile found:', targetProfile);
      // Determine what the user_id column actually is
      const userID = targetProfile.userId || targetProfile.user_id;
      
      const patients = await dataSource.query(`SELECT * FROM patients WHERE "userId" = $1 OR user_id = $1`, [userID]);
      console.log('Linked Patients:', patients);
      
      if (patients.length === 0) {
          console.log(`Creating patient record for ${userID}...`);
          const patientId = 'PT892124634';
          // Find the column name for userId in patients table
          const patCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`);
          const hasUserId = patCols.some(c => c.column_name === 'userId');
          const colName = hasUserId ? '"userId"' : 'user_id';
          
          await dataSource.query(`
            INSERT INTO patients (id, ${colName}, "patientId", "firstName", "lastName", "isActive")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, true)
          `, [userID, patientId, targetProfile.firstName, targetProfile.lastName]);
          console.log('Done.');
      }
  } else {
      console.log('Profile not found.');
  }

  // 2. Clean up anonymous mock records
  console.log('Cleaning anonymous...');
  await dataSource.query(`
    DELETE FROM patients 
    WHERE "userId" IS NULL 
    AND ("firstName" IS NULL OR "firstName" = '')
    AND "patientId" NOT LIKE 'PT892124634' -- don't delete the one user mentioned if it exists
  `).catch(e => console.log('Clean error:', e));

  await dataSource.destroy();
}

bootstrap();
