
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listAllUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('username');

    if (error) {
        console.error('Error:', error);
    } else {
        const usernames = users.map(u => u.username);
        fs.writeFileSync('usernames_list.json', JSON.stringify(usernames, null, 2));
        console.log('Saved to usernames_list.json');
    }
}

listAllUsers();
