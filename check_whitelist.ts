
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkWhitelist() {
    const { data: users, error } = await supabase
        .from('users')
        .select('username')
        .in('username', ['Clárison Gamarano', 'Daiane Gamarano', 'Pedro Borba', 'Matheus']);

    const { data: usersLike, error: errorLike } = await supabase
        .from('users')
        .select('username')
        .or('username.ilike.%Clárison%,username.ilike.%Daiane%,username.ilike.%Pedro%,username.ilike.%Matheus%');

    if (error || errorLike) {
        console.error('Error:', error || errorLike);
    } else {
        console.log('Found users (exact):', JSON.stringify(users, null, 2));
        console.log('Found users (like):', JSON.stringify(usersLike, null, 2));
    }
}

checkWhitelist();
