import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing env vars'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    let allData = [];
    let from = 0;
    const limit = 1000;
    while (true) {
        const { data, error } = await supabase.from('clientes').select('id, nome_fantasia').order('nome_fantasia').range(from, from + limit - 1);
        if (error || !data) {
            console.log('Error:', error);
            break;
        }
        allData.push(...data);
        console.log('Fetched:', data.length, 'From:', from);
        if (data.length < limit) break;
        from += limit;
    }
    console.log('Total:', allData.length);
}
run();
