import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

async function introspect() {
    let url = connectionString;
    if (connectionString.includes('dpg-') && !connectionString.includes('.render.com')) {
        const p = connectionString.split('@');
        url = `${p[0]}@${p[1].split('/')[0]}.oregon-postgres.render.com/${p[1].split('/')[1]}`;
    }

    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();

        const targetTables = ['users', 'wallets', 'patients'];

        for (const targetTable of targetTables) {
            console.log(`\n--- Tables referencing "${targetTable}" ---`);
            const res = await client.query(`
                SELECT
                    tc.table_name, 
                    kcu.column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name=$1;
            `, [targetTable]);

            for (const row of res.rows) {
                console.log(`Table: ${row.table_name}, Column: ${row.column_name} references ${targetTable}`);
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

introspect();
