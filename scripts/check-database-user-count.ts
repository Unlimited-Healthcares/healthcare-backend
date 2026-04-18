import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  let finalUrl = connectionString;
  if (connectionString?.includes('dpg-') && !connectionString.includes('.render.com')) {
    const parts = connectionString.split('@');
    finalUrl = `${parts[0]}@${parts[1].split('/')[0]}.oregon-postgres.render.com/${parts[1].split('/')[1]}`;
  }

  const client = new Client({ connectionString: finalUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM "users";');
    console.log(`Current user count: ${res.rows[0].count}`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}
run();
