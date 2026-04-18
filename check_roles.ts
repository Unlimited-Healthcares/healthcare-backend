
import { Client } from 'pg';

async function checkRoles() {
    const client = new Client({
        connectionString: 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- USERS AND ROLES ---');
        const res = await client.query(`
            SELECT u.id, u.email, u.roles, p."displayName", p."firstName", p."lastName"
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u."isActive" = true
        `);
        
        res.rows.forEach(row => {
            console.log(`Email: ${row.email}, Roles: ${row.roles}, DisplayName: ${row.displayName}, FullName: ${row.firstName} ${row.lastName}`);
        });

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

checkRoles();
