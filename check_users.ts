import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

async function main() {
    const userId = process.argv[2];
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        if (!userId) {
            console.log('Listing ALL users:');
            const allUsersRes = await client.query('SELECT id, "displayId", email, roles, "isActive" FROM users');
            console.log(allUsersRes.rows);
            process.exit(0);
        }
        console.log(`Checking user: ${userId}`);

        // Check user table
        const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            console.log('User NOT found in users table.');
            
            // Check displayId column for the same string
            const displayRes = await client.query('SELECT * FROM users WHERE "displayId" = $1', [userId]);
            if (displayRes.rows.length > 0) {
                console.log('User found by displayId!');
                console.log(displayRes.rows[0]);
            } else {
                console.log('User NOT found by displayId either.');
            }
        } else {
            console.log('User found in users table:');
            console.log(userRes.rows[0]);
        }

        // Check profile table
        const profileRes = await client.query('SELECT * FROM profiles WHERE "user_id" = $1', [userId]);
        if (profileRes.rows.length > 0) {
            console.log('Profile found for this user ID:');
            console.log(profileRes.rows[0]);
        } else {
            console.log('No profile found for this user ID.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
