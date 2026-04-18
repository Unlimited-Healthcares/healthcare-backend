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
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('--- Database Tables ---');
    res.rows.forEach(row => console.log(row.table_name));
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}
run();
