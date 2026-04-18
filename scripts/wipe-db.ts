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
    console.log('--- Wiping All Data ---');
    
    // TRUNCATE with CASCADE is the most reliable way to wipe tables with relationships
    // Reset Identity restarts any auto-incrementing IDs to 1
    await client.query('TRUNCATE TABLE "users", "profiles", "patients", "appointments", "chat_rooms", "chat_messages", "kyc_submissions" RESTART IDENTITY CASCADE;');
    
    console.log('SUCCESS: All user, profile, patient, appointment, and chat tables have been wiped clean.');
  } catch (err) {
    console.error('Error during wipe:', err.message);
  } finally {
    await client.end();
  }
}
run();
