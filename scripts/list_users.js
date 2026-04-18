
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1';

async function listUsers() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        // Count total users
        const countRes = await client.query('SELECT COUNT(*) FROM users');
        const total = countRes.rows[0].count;

        // Get recent users with some metadata
        const listRes = await client.query('SELECT id, email, roles, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 50');

        console.log(`Total users in database: ${total}`);
        console.log('\nLast 50 users:');
        console.table(listRes.rows.map(row => ({
            id: row.id,
            email: row.email,
            roles: row.roles,
            joined: row.createdAt
        })));

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await client.end();
    }
}

listUsers();
