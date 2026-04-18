import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = process.env.DATABASE_URL;
  let url = conn;
  if (conn?.includes('dpg-') && !conn.includes('.render.com')) {
    const p = conn.split('@');
    url = `${p[0]}@${p[1].split('/')[0]}.oregon-postgres.render.com/${p[1].split('/')[1]}`;
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const tables = ['users', 'profiles', 'appointments', 'centers', 'patients', 'reviews'];
    console.log('--- Database Table Counts ---');
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT count(*) FROM "${table}";`);
        console.log(`${table}: ${res.rows[0].count}`);
      } catch (e) {
        console.log(`${table}: Table doesn't exist or query failed`);
      }
    }
  } finally {
    await client.end();
  }
}
run();
