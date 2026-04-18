import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

async function main() {
    const centerId = process.argv[2];
    if (!centerId) {
        console.error('Please provide a center ID');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Use double quotes for table name to handle potential case sensitivity
        const centerRes = await client.query('SELECT * FROM "healthcare_centers" WHERE id = $1', [centerId]);
        if (centerRes.rows.length > 0) {
            console.log('Center found:');
            console.log(centerRes.rows[0]);
        } else {
            console.log('Center NOT found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
