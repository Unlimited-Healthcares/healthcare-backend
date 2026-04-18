import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function clearUsers() {
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  let finalUrl = connectionString;
  if (connectionString.includes('dpg-') && !connectionString.includes('.render.com')) {
    const parts = connectionString.split('@');
    finalUrl = `${parts[0]}@${parts[1].split('/')[0]}.oregon-postgres.render.com/${parts[1].split('/')[1]}`;
  }

  const client = new Client({ connectionString: finalUrl, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Clearing users...');
    
    // DELETE is less intensive on locks than TRUNCATE
    const res = await client.query('DELETE FROM "users";');
    console.log(`SUCCESS: Deleted ${res.rowCount} users.`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

clearUsers();
