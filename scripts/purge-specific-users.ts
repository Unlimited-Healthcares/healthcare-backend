import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

const testEmails = [
    'omokeshedrack@gmail.com',
    'shedrackomoke11@gmail.com',
    'codespheretechnologyltd@gmail.com',
    'boarderlessnetwork@gmail.com',
    'codespheretech002@gmail.com',
];

const testPhones = [
    '9157033159',
    '+44 7736 801569',
    '09157033159',
    '07013870312'
];

async function purgeUsers() {
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env');
        return;
    }

    let url = connectionString;
    if (connectionString.includes('dpg-') && !connectionString.includes('.render.com')) {
        const parts = connectionString.split('@');
        url = `${parts[0]}@${parts[1].split('/')[0]}.oregon-postgres.render.com/${parts[1].split('/')[1]}`;
    }

    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('--- RECURSIVE PURGE OF QA USERS (Fix v5) ---');

        const targets = new Map<string, string>(); // ID -> Identifier (Email or Phone)

        // Find by Email
        for (const email of testEmails) {
            const res = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (res.rows.length > 0) targets.set(res.rows[0].id, email);
        }

        // Find by Phone
        for (const phone of testPhones) {
            const stripped = phone.replace(/\D/g, '');
            const suffix = stripped.length >= 5 ? stripped.slice(-5) : stripped;

            const res = await client.query('SELECT user_id, phone FROM profiles WHERE phone ILIKE $1 OR phone ILIKE $2', [
                `%${phone.replace(/\s+/g, '%')}%`,
                `%${suffix}`
            ]);

            if (res.rows.length > 0) {
                for (const row of res.rows) {
                    console.log(`- Found match for ${phone}: ${row.phone} -> User ID: ${row.user_id}`);
                    targets.set(row.user_id, row.phone);
                }
            }
        }

        if (targets.size === 0) {
            console.log('No users found to purge.');
            return;
        }

        for (const [id, identifier] of targets.entries()) {
            console.log(`\nPurging user: ${identifier} (ID: ${id})`);

            // 1. SECOND-LEVEL DEPENDENCIES

            // wallet_transactions -> wallets
            try {
                const walletRes = await client.query('SELECT id FROM wallets WHERE "userId" = $1', [id]);
                for (const row of walletRes.rows) {
                    await client.query('DELETE FROM wallet_transactions WHERE "walletId" = $1', [row.id]);
                }
            } catch (e) { }

            // Tables referring to patients
            try {
                const patientRes = await client.query('SELECT id FROM patients WHERE "userId" = $1', [id]);
                for (const row of patientRes.rows) {
                    const pId = row.id;
                    const pTables = ['patient_visits', 'medical_record_shares', 'medical_records', 'medical_record_share_requests', 'referrals', 'medical_reports', 'ai_chat_sessions', 'user_health_profiles', 'medical_images', 'reviews'];
                    for (const pt of pTables) {
                        try { await client.query(`DELETE FROM "${pt}" WHERE "patientId" = $1`, [pId]); } catch (e) { }
                    }
                    // Handle specific patient columns
                    try { await client.query('DELETE FROM appointments WHERE patient_id = $1 OR "patientId" = $1', [pId, pId]); } catch (e) { }
                    try { await client.query('DELETE FROM care_tasks WHERE patient_id = $1', [pId]); } catch (e) { }
                }
            } catch (e) { }

            // 2. FIRST-LEVEL DEPENDENCIES (Dynamic)
            const fkRes = await client.query(`
                SELECT tc.table_name, kcu.column_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='users';
            `);

            for (const table of fkRes.rows) {
                try {
                    await client.query(`DELETE FROM "${table.table_name}" WHERE "${table.column_name}" = $1`, [id]);
                } catch (e) { }
            }

            // 3. FINAL PURGE
            try {
                const finalRes = await client.query('DELETE FROM users WHERE id = $1', [id]);
                if (finalRes.rowCount > 0) {
                    console.log(`- SUCCESS: ${identifier} completely purged.`);
                }
            } catch (err: any) {
                console.error(`- Error final purge ${identifier}: ${err.message}`);
            }
        }

    } catch (err: any) {
        console.error('Critical Error:', err.message);
    } finally {
        await client.end();
        console.log('\nPurge process complete.');
    }
}

purgeUsers();
