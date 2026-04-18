
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
  
  // 1. Delete all patients EXCEPT the target one
  const targetId = 'iwualasixtus22\'s Org';
  console.log(`Deleting all patients except ${targetId}...`);
  await dataSource.query(`
    DELETE FROM patients 
    WHERE ("firstName" || ' ' || "lastName" NOT LIKE '%${targetId}%' 
           AND "firstName" NOT LIKE '%${targetId}%')
  `);
  console.log('Cleanup done.');

  // 2. Sync age/gender from profile for the remaining one
  await dataSource.query(`
    UPDATE patients p
    SET "gender" = prof.gender,
        "age" = EXTRACT(YEAR FROM AGE(prof."dateOfBirth"))::int
    FROM profiles prof
    WHERE p."userId" = prof."userId"
  `).catch(e => console.log('Age/Gender sync error:', e.message));

  // 3. Find if there are vitals elsewhere (MedicalRecords)
  const patient = await dataSource.query(`SELECT id FROM patients LIMIT 1`);
  if (patient.length > 0) {
      const records = await dataSource.query(`SELECT vitals FROM medical_records WHERE patientId = $1`, [patient[0].id]);
      console.log('Vitals from MedicalRecords:', records);
      if (records.length > 0 && records[0].vitals) {
          console.log('Syncing vitals back to patient record...');
          await dataSource.query(`UPDATE patients SET vitals = $1 WHERE id = $2`, [records[0].vitals, patient[0].id]);
      }
  }

  await dataSource.destroy();
}

bootstrap();
