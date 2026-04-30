import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function checkMigrations() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await ds.initialize();
    const migs = await ds.query("SELECT name FROM migrations");
    console.log(migs.map((m: any) => m.name));
  } catch (err) {
    console.error(err);
  } finally {
    await ds.destroy();
  }
}
checkMigrations();
