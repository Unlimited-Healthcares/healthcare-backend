
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
  
  // 1. Identify columns again
  const patCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`);
  const patUserIdCol = patCols.find(c => c.column_name.toLowerCase() === 'userid')?.column_name || 'userId';
  console.log(`Patients table uses column: ${patUserIdCol}`);

  const targetName = "iwualasixtus22's Org";
  const profiles = await dataSource.query(`SELECT * FROM profiles WHERE "displayName" ILIKE $1`, [`%${targetName}%`]);
  
  if (profiles.length > 0) {
      const prof = profiles[0];
      const userID = prof.user_id || prof.userId;

      await dataSource.query(`
        UPDATE patients 
        SET 
            "patientId" = 'PT892124634',
            "firstName" = $1,
            "lastName" = $2,
            vitals = $3
        WHERE "${patUserIdCol}" = $4
      `, [prof.firstName, prof.lastName, JSON.stringify({
          heartRate: 72,
          bp: "120/80",
          weight: prof.weight || 70,
          height: prof.height || 175,
          bloodGroup: prof.bloodGroup,
          temp: "36.6",
          spO2: 98
      }), userID]);
      console.log('Update done.');
  }

  await dataSource.destroy();
}

bootstrap();
