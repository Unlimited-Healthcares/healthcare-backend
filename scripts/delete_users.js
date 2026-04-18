
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1';

const userIdsToDelete = [
    '49103e0a-0a2c-403e-b6d9-295f082e460c',
    '54344a1f-1f16-4961-a68e-b2ea3b9f8fc6',
    'af407e88-1b12-406f-a9cf-63472a3f1a4d',
    '415defec-d5cb-4a38-9b21-dc4b5d536ec1',
    '7acc4b35-21f0-4525-90d4-d38859f91992'
];

async function deleteUsers() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        console.log(`Starting deletion of ${userIdsToDelete.length} users...`);

        // Start transaction
        await client.query('BEGIN');

        // Delete profiles first (due to foreign key constraints if not cascaded)
        const profileCountRes = await client.query('DELETE FROM profiles WHERE "user_id" = ANY($1)', [userIdsToDelete]);
        console.log(`Deleted ${profileCountRes.rowCount} profiles.`);

        // Delete users
        const userCountRes = await client.query('DELETE FROM users WHERE id = ANY($1)', [userIdsToDelete]);
        console.log(`Deleted ${userCountRes.rowCount} users.`);

        await client.query('COMMIT');
        console.log('Successfully committed deletions.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during deletion (transaction rolled back):', err);
    } finally {
        await client.end();
    }
}

deleteUsers();
