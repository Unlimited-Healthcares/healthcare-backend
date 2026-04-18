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
    console.log('--- Clearing Major Tables ---');
    const tables = [
      'users',
      'profiles',
      'patients',
      'appointments',
      'chat_messages',
      'chat_rooms',
      'kyc_submissions',
      'medical_records',
      'blood_donations',
      'blood_donors',
      'orders',
      'shopping_carts',
      'cart_items'
    ];

    for (const table of tables) {
      try {
        const res = await client.query(`DELETE FROM "${table}";`);
        console.log(`- Cleared ${table}: Deleted ${res.rowCount} rows.`);
      } catch (e) {
        // Table might not exist or have constraints
        console.log(`- Skipping ${table} (Constraint or query failed)`);
      }
    }
    console.log('\nSUCCESS: Major tables have been cleared.');
  } finally {
    await client.end();
  }
}
run();
