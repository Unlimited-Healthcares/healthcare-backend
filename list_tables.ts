import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function listTables() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await ds.initialize();
    const tabs = await ds.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(tabs.map((t: any) => t.table_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    await ds.destroy();
  }
}
listTables();
