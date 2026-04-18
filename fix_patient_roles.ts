
import { Client } from 'pg';

async function fixRoles() {
    const client = new Client({
        connectionString: 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- FIXING ROLES ---');
        
        // Fix Super Admin (admin,patient -> admin)
        await client.query(`
            UPDATE users SET roles = 'admin' 
            WHERE email = 'admin@unlimitedhealthcares.com' AND roles LIKE '%patient%'
        `);
        
        // Fix Unmedia (patient -> doctor)
        await client.query(`
            UPDATE users SET roles = 'doctor' 
            WHERE email = 'unmedia001@gmail.com' AND roles = 'patient'
        `);
        
        // Fix Emmanuel Eze (eeolife@gmail.com) (patient -> doctor)
        await client.query(`
            UPDATE users SET roles = 'doctor' 
            WHERE email = 'eeolife@gmail.com' AND roles = 'patient'
        `);

        console.log('✅ Specific roles fixed.');

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

fixRoles();
