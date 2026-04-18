import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

const testEmails = [
    'omokeshedrack@gmail.com',
    'shedrackomoke11@gmail.com',
    'codespheretechnologyltd@gmail.com',
    'codespheretech002@gmail.com',
    'boarderlessnetwork@gmail.com'
];

async function cleanupUsers() {
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env');
        return;
    }

    // Fix for Render internal URLs if running locally
    let finalUrl = connectionString;
    if (connectionString.includes('dpg-') && !connectionString.includes('.render.com')) {
        const parts = connectionString.split('@');
        finalUrl = `${parts[0]}@${parts[1].split('/')[0]}.oregon-postgres.render.com/${parts[1].split('/')[1]}`;
    }

    const client = new Client({
        connectionString: finalUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        for (const email of testEmails) {
            console.log(`Searching for user: ${email}`);

            // 1. Get User ID
            const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

            if (userRes.rows.length > 0) {
                const userId = userRes.rows[0].id;
                console.log(`Found User ID: ${userId}. Starting cleanup...`);

                // Deleting from users should cascade to profiles due to TypeORM settings, 
                // but we'll be explicit for safety with other clinical data tables.

                await client.query('DELETE FROM patients WHERE "userId" = $1', [userId]);
                await client.query('DELETE FROM medical_records WHERE "userId" = $1 OR "patientId" = $1', [userId, userId]);
                await client.query('DELETE FROM appointments WHERE "patientId" = $1 OR "doctorId" = $1', [userId, userId]);
                await client.query('DELETE FROM requests WHERE "senderId" = $1 OR "recipientId" = $1', [userId, userId]);
                await client.query('DELETE FROM medical_reports WHERE "patientId" = $1', [userId]);

                // Finally delete the user (will delete profile via cascade)
                await client.query('DELETE FROM users WHERE id = $1', [userId]);
                console.log(`SUCCESS: Deleted user ${email} and associated records.`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }

    } catch (err) {
        console.error('Error during cleanup:', err.message);
    } finally {
        await client.end();
        console.log('Cleanup process finished.');
    }
}

cleanupUsers();
