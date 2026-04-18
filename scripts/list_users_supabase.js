
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hgsfwovserxgufvyzizd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnc2Z3b3ZzZXJ4Z3Vmdnl6aXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDUyMjYsImV4cCI6MjA4NzQyMTIyNn0.PNmIc3sgL3HLLLYfIlTRTbVMwPuLnNzW-MN-s9r7yHQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listUsers() {
    try {
        console.log('Fetching users from Supabase...');
        const { data, count, error } = await supabase
            .from('users')
            .select('id, email, roles, createdAt', { count: 'exact' })
            .order('createdAt', { ascending: false });

        if (error) {
            throw error;
        }

        console.log(`Total users: ${count}`);
        console.table(data.map(u => ({
            id: u.id,
            email: u.email,
            roles: u.roles,
            joined: u.createdAt
        })));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listUsers();
