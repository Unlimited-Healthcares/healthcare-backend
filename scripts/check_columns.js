
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1';

async function checkColumns() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
        `);
        console.log('Columns in profiles table:');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkColumns();
