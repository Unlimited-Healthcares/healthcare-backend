
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedAccounts() {
    const connectionString = 'postgresql://healthcare_user:qvlc4jKWSRGFlbVAhA9ZToKCuzxPYMp5@dpg-d6dqt2ctgctc73cgvbf0-a.oregon-postgres.render.com/healthcare_y6g1';
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const roles = [
        'admin',
        'doctor',
        'patient',
        'staff',
        'center',
        'biotech_engineer',
        'ambulance_service',
        'fitness_center',
        'diagnostic_center',
        'allied_practitioner',
        'diagnostic',
        'pharmacy'
    ];

    try {
        await client.connect();
        console.log('Connected to database');

        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        for (const role of roles) {
            const email = `${role.replace('_', '')}.test@unlimitedhealthcares.com`;
            console.log(`Processing role: ${role} (${email})`);

            // Check if user exists
            const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            let userId;

            if (checkRes.rows.length > 0) {
                userId = checkRes.rows[0].id;
                console.log(`User already exists, updating...`);
                await client.query(
                    'UPDATE users SET password = $1, roles = $2, "isActive" = true, "isEmailVerified" = true WHERE id = $3',
                    [hashedPassword, [role], userId]
                );
            } else {
                userId = uuidv4();
                const displayId = `TEST-${role.toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
                console.log(`Creating new user with ID: ${userId}`);
                await client.query(
                    'INSERT INTO users (id, email, password, roles, "isActive", "isEmailVerified", "displayId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
                    [userId, email, hashedPassword, [role], true, true, displayId]
                );
            }

            // Create or update profile
            const profileCheck = await client.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
            if (profileCheck.rows.length === 0) {
                const profileId = uuidv4();
                console.log(`Creating profile for ${userId}`);
                await client.query(
                    'INSERT INTO profiles (id, user_id, "firstName", "lastName", "displayName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
                    [profileId, userId, 'Test', role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '), `Test ${role}`]
                );
            } else {
                console.log(`Profile already exists for ${userId}`);
            }
        }

        console.log('Seeding completed successfully');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await client.end();
    }
}

seedAccounts();
