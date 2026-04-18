
import { Client } from 'pg';

async function checkPatients() {
    const client = new Client({
        connectionString: 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- PATIENT RECORDS (patients table) ---');
        const res = await client.query(`
            SELECT p.id, p."patientId", p."userId", p."firstName", p."lastName", p.vitals
            FROM patients p
        `);
        
        res.rows.forEach(row => {
            console.log(`Patient ID: ${row.id}, DisplayID: ${row.patientId}, UserId: ${row.userId}, Name: ${row.firstName} ${row.lastName}, Vitals: ${JSON.stringify(row.vitals)}`);
        });

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

checkPatients();
