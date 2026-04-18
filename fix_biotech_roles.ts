import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('Fixing user roles and displayIds...');

        // 1. Identify users with PT displayId but doctor role
        const res = await client.query('SELECT id, email, "displayId", roles FROM users WHERE "displayId" LIKE \'PT%\' AND roles = \'doctor\'');
        console.log(`Found ${res.rows.length} mislabeled users.`);

        for (const user of res.rows) {
            // Check if this is one of the accounts the user wants as biotech
            // For now, let's just make them biotech_engineer if they aren't patients
            const newRole = 'biotech_engineer';
            const newDisplayId = user.displayId.replace('PT', 'BIO');
            
            console.log(`Updating ${user.email}: ${user.displayId} -> ${newDisplayId}, role: ${user.roles} -> ${newRole}`);
            
            await client.query(
                'UPDATE users SET roles = $1, "displayId" = $2 WHERE id = $3',
                [newRole, newDisplayId, user.id]
            );
        }

        console.log('Done.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
