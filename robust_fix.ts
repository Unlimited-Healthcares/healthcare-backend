
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
  
  // 1. Check for profile columns
  const pCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`);
  const profUserIdCol = pCols.find(c => c.column_name.toLowerCase() === 'userid')?.column_name || 'user_id';
  const profFNameCol = pCols.find(c => c.column_name.toLowerCase() === 'firstname')?.column_name || 'firstName';
  const profLNameCol = pCols.find(c => c.column_name.toLowerCase() === 'lastname')?.column_name || 'lastName';

  const uCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
  const userRolesCol = uCols.find(c => c.column_name.toLowerCase() === 'roles')?.column_name || 'roles';

  const patCols = await dataSource.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`);
  const patUserIdCol = patCols.find(c => c.column_name.toLowerCase() === 'userid')?.column_name || 'user_id';
  const patFNameCol = patCols.find(c => c.column_name.toLowerCase() === 'firstname')?.column_name || 'firstName';
  const patLNameCol = patCols.find(c => c.column_name.toLowerCase() === 'lastname')?.column_name || 'lastName';

  console.log(`Syncing Using Columns: prof."${profUserIdCol}", pat."${patUserIdCol}"`);

  // Update existing
  await dataSource.query(`
    UPDATE patients p
    SET "${patFNameCol}" = prof."${profFNameCol}",
        "${patLNameCol}" = prof."${profLNameCol}"
    FROM profiles prof
    WHERE p."${patUserIdCol}" = prof."${profUserIdCol}"
    AND (p."${patFNameCol}" IS NULL OR p."${patFNameCol}" = '')
    AND (prof."${profFNameCol}" IS NOT NULL AND prof."${profFNameCol}" != '')
  `).catch(e => console.log('Update Error:', e.message));

  // Insert missing
  await dataSource.query(`
    INSERT INTO patients (id, "${patUserIdCol}", "patientId", "${patFNameCol}", "${patLNameCol}", "isActive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(), 
        u.id, 
        'PT' || EXTRACT(EPOCH FROM NOW())::bigint || LPAD(ROW_NUMBER() OVER ()::text, 4, '0'),
        prof."${profFNameCol}", 
        prof."${profLNameCol}", 
        true, 
        NOW(), 
        NOW()
    FROM users u
    INNER JOIN profiles prof ON prof."${profUserIdCol}" = u.id
    WHERE u."${userRolesCol}" LIKE '%patient%'
    AND NOT EXISTS (SELECT 1 FROM patients p WHERE p."${patUserIdCol}" = u.id)
  `).catch(e => console.log('Insert Error:', e.message));

  // Remove anonymous
  await dataSource.query(`
    DELETE FROM patients 
    WHERE "${patUserIdCol}" IS NULL 
    AND ("${patFNameCol}" IS NULL OR "${patFNameCol}" = '')
    AND "patientId" NOT LIKE 'PT892124634'
  `).catch(e => console.log('Delete Error:', e.message));

  await dataSource.destroy();
}

bootstrap();
