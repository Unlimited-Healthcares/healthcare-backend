
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
  
  // 1. Add missing columns to patients
  console.log('Adding missing columns to patients table...');
  await dataSource.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR`).catch(() => {});
  await dataSource.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INT`).catch(() => {});
  
  // 2. Identify target
  const targetName = "iwualasixtus22's Org";
  const profiles = await dataSource.query(`SELECT * FROM profiles WHERE "displayName" ILIKE $1`, [`%${targetName}%`]);
  
  if (profiles.length > 0) {
      const prof = profiles[0];
      const userID = prof.user_id || prof.userId;

      // DELETE OTHERS
      await dataSource.query(`DELETE FROM patients WHERE "userId" != $1 OR "userId" IS NULL`, [userID]).catch(() => {
          dataSource.query(`DELETE FROM patients WHERE user_id != $1 OR user_id IS NULL`, [userID]);
      });
      console.log('Other patient records removed.');

      // UPDATE TARGET
      const patients = await dataSource.query(`SELECT id FROM patients WHERE "userId" = $1 OR user_id = $1`, [userID]);
      if (patients.length > 0) {
          const pId = patients[0].id;
          const vitals = {
              weight: prof.weight,
              height: prof.height,
              bloodGroup: prof.bloodGroup,
              genotype: prof.genotype
          };
          
          await dataSource.query(`
            UPDATE patients 
            SET gender = $1, age = $2, vitals = $3, "firstName" = $4, "lastName" = $5, "patientId" = $6
            WHERE id = $7
          `, [prof.gender, 25, JSON.stringify(vitals), prof.firstName, prof.lastName, 'PT892124634', pId]);
          console.log('Synced.');
      }
  }

  await dataSource.destroy();
}

bootstrap();
