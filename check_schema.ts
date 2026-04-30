import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function checkSchema() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await ds.initialize();
    const schema = await ds.query("SELECT table_schema FROM information_schema.tables WHERE table_name = 'patients'");
    console.log(schema);
  } catch (err) {
    console.error(err);
  } finally {
    await ds.destroy();
  }
}
checkSchema();
